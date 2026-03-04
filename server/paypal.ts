// PayPal SDK Integration for B2B Orders and License Subscriptions
// Uses credentials configured by admin in payment settings

import crypto from "crypto";
import { createRequire } from "module";

// Use createRequire for CommonJS PayPal SDK compatibility in ESM
const require = createRequire(import.meta.url);
const PayPalSDK = require("@paypal/paypal-server-sdk");
const { Client, Environment, LogLevel, OAuthAuthorizationController, OrdersController, CheckoutPaymentIntent } = PayPalSDK;

const ENCRYPTION_KEY = process.env.SESSION_SECRET || "";

const PAYPAL_BASE_URL = "https://api-m.sandbox.paypal.com"; // Switch to api-m.paypal.com for live

function getEncryptionKey(): Buffer {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 16) {
    throw new Error("SESSION_SECRET must be set with at least 16 characters for PayPal credential encryption");
  }
  return crypto.scryptSync(ENCRYPTION_KEY, 'paypal-salt', 32);
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptSecret(encryptedText: string): string {
  try {
    const [ivHex, encrypted] = encryptedText.split(':');
    if (!ivHex || !encrypted) return '';
    const iv = Buffer.from(ivHex, 'hex');
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return '';
  }
}

function createPayPalClient(clientId: string, clientSecret: string) {
  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: clientId,
      oAuthClientSecret: clientSecret,
    },
    timeout: 0,
    environment: Environment.Sandbox,
    logging: {
      logLevel: LogLevel.Info,
      logRequest: { logBody: true },
      logResponse: { logHeaders: true },
    },
  });
}

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const resp = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  const data = await resp.json() as any;
  if (!data.access_token) throw new Error("PayPal auth failed: " + JSON.stringify(data));
  return data.access_token;
}

export async function getPayPalClientToken(clientId: string, clientSecret: string): Promise<string> {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const client = createPayPalClient(clientId, clientSecret);
  const oAuthController = new OAuthAuthorizationController(client);
  
  const { result } = await oAuthController.requestToken(
    { authorization: `Basic ${auth}` },
    { intent: "sdk_init", response_type: "client_token" }
  );
  
  return result.accessToken || '';
}

export async function createPayPalOrderHandler(
  clientId: string,
  clientSecret: string,
  amount: string,
  currency: string,
  intent: string,
  returnUrl?: string,
  cancelUrl?: string
) {
  const client = createPayPalClient(clientId, clientSecret);
  const ordersController = new OrdersController(client);
  
  const orderBody: any = {
    intent: intent as any,
    purchaseUnits: [
      {
        amount: {
          currencyCode: currency,
          value: amount,
        },
      },
    ],
  };
  
  if (returnUrl || cancelUrl) {
    orderBody.paymentSource = {
      paypal: {
        experienceContext: {
          returnUrl: returnUrl || cancelUrl,
          cancelUrl: cancelUrl || returnUrl,
          userAction: "PAY_NOW",
          brandName: "MonkeyPlan",
        },
      },
    };
  }
  
  const collect = {
    body: orderBody,
    prefer: "return=minimal",
  };
  
  const { body, ...httpResponse } = await ordersController.createOrder(collect);
  return { body: JSON.parse(String(body)), statusCode: httpResponse.statusCode };
}

export async function capturePayPalOrderHandler(
  clientId: string,
  clientSecret: string,
  orderId: string
) {
  const client = createPayPalClient(clientId, clientSecret);
  const ordersController = new OrdersController(client);
  
  const collect = {
    id: orderId,
    prefer: "return=minimal",
  };
  
  const { body, ...httpResponse } = await ordersController.captureOrder(collect);
  return { body: JSON.parse(String(body)), statusCode: httpResponse.statusCode };
}

export async function getPayPalOrderStatus(
  clientId: string,
  clientSecret: string,
  orderId: string
): Promise<{ status: string; id: string }> {
  try {
    const client = createPayPalClient(clientId, clientSecret);
    const ordersController = new OrdersController(client);
    
    console.log("Calling PayPal getOrder for:", orderId);
    const response = await ordersController.getOrder({ id: orderId });
    console.log("PayPal getOrder raw response:", response);
    
    const parsed = typeof response.body === 'string' 
      ? JSON.parse(response.body) 
      : response.body;
    console.log("PayPal getOrder parsed:", parsed);
    
    return { status: parsed.status, id: parsed.id };
  } catch (error: any) {
    console.error("getPayPalOrderStatus error:", error.message, error);
    throw error;
  }
}

// ============================================================
// PayPal Subscription (Billing) API — for recurring licenses
// ============================================================

export async function createPayPalProduct(
  clientId: string,
  clientSecret: string,
  name: string,
  description: string
): Promise<string> {
  const token = await getAccessToken(clientId, clientSecret);
  const resp = await fetch(`${PAYPAL_BASE_URL}/v1/catalog/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      description,
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });
  const data = await resp.json() as any;
  if (!data.id) throw new Error("PayPal product creation failed: " + JSON.stringify(data));
  return data.id;
}

export async function createPayPalBillingPlan(
  clientId: string,
  clientSecret: string,
  productId: string,
  planName: string,
  amountEur: string,
  intervalUnit: "MONTH" | "YEAR",
  intervalCount: number
): Promise<string> {
  const token = await getAccessToken(clientId, clientSecret);
  const resp = await fetch(`${PAYPAL_BASE_URL}/v1/billing/plans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name: planName,
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: { interval_unit: intervalUnit, interval_count: intervalCount },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0, // 0 = infinite
          pricing_scheme: {
            fixed_price: { value: amountEur, currency_code: "EUR" },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    }),
  });
  const data = await resp.json() as any;
  if (!data.id) throw new Error("PayPal billing plan creation failed: " + JSON.stringify(data));
  return data.id;
}

export async function createPayPalSubscription(
  clientId: string,
  clientSecret: string,
  planId: string,
  returnUrl: string,
  cancelUrl: string,
  subscriberEmail?: string
): Promise<{ subscriptionId: string; approveUrl: string }> {
  const token = await getAccessToken(clientId, clientSecret);
  const body: any = {
    plan_id: planId,
    application_context: {
      brand_name: "MonkeyPlan",
      locale: "it-IT",
      shipping_preference: "NO_SHIPPING",
      user_action: "SUBSCRIBE_NOW",
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  };
  if (subscriberEmail) {
    body.subscriber = { email_address: subscriberEmail };
  }
  const resp = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await resp.json() as any;
  if (!data.id) throw new Error("PayPal subscription creation failed: " + JSON.stringify(data));
  const approveLink = data.links?.find((l: any) => l.rel === "approve");
  if (!approveLink) throw new Error("No approve URL in PayPal subscription response");
  return { subscriptionId: data.id, approveUrl: approveLink.href };
}

export async function getPayPalSubscription(
  clientId: string,
  clientSecret: string,
  subscriptionId: string
): Promise<{ id: string; status: string; billing_info?: any }> {
  const token = await getAccessToken(clientId, clientSecret);
  const resp = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  const data = await resp.json() as any;
  return data;
}

export async function cancelPayPalSubscription(
  clientId: string,
  clientSecret: string,
  subscriptionId: string,
  reason: string = "Cancellato dall'utente"
): Promise<void> {
  const token = await getAccessToken(clientId, clientSecret);
  await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });
}

export async function suspendPayPalSubscription(
  clientId: string,
  clientSecret: string,
  subscriptionId: string,
  reason: string = "Sospeso dall'utente"
): Promise<void> {
  const token = await getAccessToken(clientId, clientSecret);
  await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/suspend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });
}

export async function activatePayPalSubscription(
  clientId: string,
  clientSecret: string,
  subscriptionId: string,
  reason: string = "Riattivato dall'utente"
): Promise<void> {
  const token = await getAccessToken(clientId, clientSecret);
  await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/activate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });
}

export function durationMonthsToPayPalInterval(months: number): { intervalUnit: "MONTH" | "YEAR"; intervalCount: number } {
  if (months === 12) return { intervalUnit: "YEAR", intervalCount: 1 };
  if (months === 24) return { intervalUnit: "YEAR", intervalCount: 2 };
  return { intervalUnit: "MONTH", intervalCount: months };
}
