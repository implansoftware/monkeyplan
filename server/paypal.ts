// PayPal SDK Integration for B2B Orders
// Uses credentials configured by admin in payment settings

import crypto from "crypto";
import { createRequire } from "module";

// Use createRequire for CommonJS PayPal SDK compatibility in ESM
const require = createRequire(import.meta.url);
const PayPalSDK = require("@paypal/paypal-server-sdk");
const { Client, Environment, LogLevel, OAuthAuthorizationController, OrdersController, CheckoutPaymentIntent } = PayPalSDK;

const ENCRYPTION_KEY = process.env.SESSION_SECRET || "";

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
    environment: Environment.Sandbox, // Use Sandbox for testing with sandbox credentials
    logging: {
      logLevel: LogLevel.Info,
      logRequest: { logBody: true },
      logResponse: { logHeaders: true },
    },
  });
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
    intent: intent as any, // CheckoutPaymentIntent enum value
    purchaseUnits: [
      {
        amount: {
          currencyCode: currency,
          value: amount,
        },
      },
    ],
  };
  
  // Add application_context for proper redirect handling
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
