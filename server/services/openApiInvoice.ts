export interface OpenApiInvoiceConfig {
  token: string;
  sandboxMode: boolean;
  fiscalId: string;
}

export interface OpenApiInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export interface OpenApiInvoiceRecipient {
  name: string;
  vatId?: string;
  taxCode?: string;
  street?: string;
  city?: string;
  zip?: string;
  province?: string;
  countryCode?: string;
  destinationCode?: string;
  pec?: string;
}

export interface OpenApiInvoiceData {
  documentType?: string;
  documentNumber: string;
  issueDate: string;
  recipient: OpenApiInvoiceRecipient;
  items: OpenApiInvoiceItem[];
  paymentMethod?: string;
  paymentTermDays?: number;
  causal?: string;
}

export interface OpenApiInvoiceResult {
  success: boolean;
  invoiceId?: string;
  state?: string;
  errorMessage?: string;
  rawResponse?: any;
}

export interface OpenApiConfigurationData {
  fiscalId: string;
  name: string;
  email: string;
  receipts?: boolean;
  customerInvoice?: boolean;
  supplierInvoice?: boolean;
  receiptsAuthentication?: {
    taxCode: string;
    password?: string;
    pin?: string;
  };
  callbackUrl?: string;
}

function getBaseUrl(_sandboxMode: boolean): string {
  return "https://invoice.openapi.com";
}

async function apiCall(
  method: string,
  path: string,
  config: { token: string; sandboxMode: boolean },
  body?: any,
): Promise<any> {
  const baseUrl = getBaseUrl(config.sandboxMode);
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${config.token}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`OpenAPI.com response not JSON (HTTP ${res.status}): ${text.substring(0, 300)}`);
  }

  if (!res.ok) {
    const errMsg = data?.message || data?.error || JSON.stringify(data);
    throw new Error(`OpenAPI.com ${method} ${path} failed (HTTP ${res.status}): ${errMsg}`);
  }

  return data;
}

export async function getConfigurations(config: { token: string; sandboxMode: boolean }): Promise<any[]> {
  const result = await apiCall("GET", "/IT-configurations", config);
  return result?.data || [];
}

export async function createConfiguration(
  config: { token: string; sandboxMode: boolean },
  data: OpenApiConfigurationData,
): Promise<any> {
  const payload: any = {
    fiscal_id: data.fiscalId,
    name: data.name,
    email: data.email,
    receipts: data.receipts ?? true,
    customer_invoice: data.customerInvoice ?? true,
    supplier_invoice: data.supplierInvoice ?? false,
  };

  if (data.receiptsAuthentication) {
    payload.receipts_authentication = {
      taxCode: data.receiptsAuthentication.taxCode,
      ...(data.receiptsAuthentication.password && { password: data.receiptsAuthentication.password }),
      ...(data.receiptsAuthentication.pin && { pin: data.receiptsAuthentication.pin }),
    };
  }

  if (data.callbackUrl) {
    payload.api_configurations = [
      {
        event: "receipt",
        callback: { method: "JSON", url: data.callbackUrl },
      },
      {
        event: "receipt-error",
        callback: { method: "JSON", url: data.callbackUrl },
      },
      {
        event: "customer-invoice",
        callback: { method: "JSON", url: data.callbackUrl },
      },
    ];
  }

  return await apiCall("POST", "/IT-configurations", config, payload);
}

export async function updateConfiguration(
  config: { token: string; sandboxMode: boolean },
  fiscalId: string,
  updates: Partial<OpenApiConfigurationData>,
): Promise<any> {
  const payload: any = {};
  if (updates.name) payload.name = updates.name;
  if (updates.email) payload.email = updates.email;
  if (updates.receiptsAuthentication) {
    payload.receipts_authentication = {
      taxCode: updates.receiptsAuthentication.taxCode,
      ...(updates.receiptsAuthentication.password && { password: updates.receiptsAuthentication.password }),
      ...(updates.receiptsAuthentication.pin && { pin: updates.receiptsAuthentication.pin }),
    };
  }

  return await apiCall("PATCH", `/IT-configurations/${fiscalId}`, config, payload);
}

export async function sendInvoice(
  config: OpenApiInvoiceConfig,
  data: OpenApiInvoiceData,
): Promise<OpenApiInvoiceResult> {
  try {
    const lines = data.items.map((item, index) => ({
      line_number: index + 1,
      description: item.description,
      quantity: item.quantity.toFixed(2),
      unit_price: item.unitPrice.toFixed(2),
      total_price: (item.quantity * item.unitPrice).toFixed(2),
      vat_rate: item.vatRate.toFixed(2),
    }));

    const totalGross = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice * (1 + item.vatRate / 100),
      0,
    );

    const invoicePayload: any = {
      fiscal_id: config.fiscalId,
      document_type: data.documentType || "TD01",
      document_number: data.documentNumber,
      issue_date: data.issueDate,
      recipient: {
        ...(data.recipient.vatId && { vat_id: data.recipient.vatId }),
        ...(data.recipient.taxCode && { tax_code: data.recipient.taxCode }),
        ...(data.recipient.name && { name: data.recipient.name }),
        ...(data.recipient.street && { street: data.recipient.street }),
        ...(data.recipient.city && { city: data.recipient.city }),
        ...(data.recipient.zip && { zip: data.recipient.zip }),
        ...(data.recipient.province && { province: data.recipient.province }),
        country_code: data.recipient.countryCode || "IT",
        ...(data.recipient.destinationCode && { destination_code: data.recipient.destinationCode }),
        ...(data.recipient.pec && { pec: data.recipient.pec }),
      },
      lines,
      payment: {
        method: data.paymentMethod || "MP05",
        terms: data.paymentTermDays ? `TP02` : "TP02",
        ...(data.paymentTermDays && { days: data.paymentTermDays }),
        amount: totalGross.toFixed(2),
      },
      ...(data.causal && { causal: data.causal }),
    };

    const result = await apiCall("POST", "/IT-invoices", { token: config.token, sandboxMode: config.sandboxMode }, invoicePayload);

    const invoiceId = result?.data?.id || result?.id;
    const state = result?.data?.state || result?.state;
    console.log(`[OpenAPI.com] Invoice sent: ${data.documentNumber} → ${invoiceId} (state: ${state})`);

    return {
      success: true,
      invoiceId,
      state,
      rawResponse: result,
    };
  } catch (error: any) {
    console.error(`[OpenAPI.com] Invoice send error: ${error.message}`);
    return {
      success: false,
      errorMessage: error.message || "Unknown error during invoice submission",
    };
  }
}

export async function validateInvoice(
  config: { token: string; sandboxMode: boolean },
  invoiceXml: string,
): Promise<{ valid: boolean; errors?: any[] }> {
  try {
    const result = await apiCall("POST", "/IT-invoices_validate", config, { invoice: invoiceXml });
    return { valid: true };
  } catch (error: any) {
    return { valid: false, errors: [{ message: error.message }] };
  }
}

export async function getInvoices(
  config: { token: string; sandboxMode: boolean },
  filters?: { fiscalId?: string; status?: string; limit?: number; skip?: number },
): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.fiscalId) params.set("fiscal_id", filters.fiscalId);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.limit) params.set("limit", filters.limit.toString());
  if (filters?.skip) params.set("skip", filters.skip.toString());

  const queryString = params.toString();
  const path = `/IT-invoices${queryString ? `?${queryString}` : ""}`;
  const result = await apiCall("GET", path, config);
  return result?.data || [];
}

export async function testOpenApiConnection(
  config: { token: string; sandboxMode: boolean },
  fiscalId?: string,
): Promise<{ success: boolean; message: string; configurations?: any[] }> {
  try {
    const configs = await getConfigurations(config);
    const env = config.sandboxMode ? "SANDBOX" : "PRODUCTION";
    let message = `Connection to OpenAPI.com (${env}) successful. Found ${configs.length} configuration(s).`;

    if (fiscalId) {
      const found = configs.find((c: any) => c.fiscal_id === fiscalId);
      if (found) {
        message += ` Configuration for "${fiscalId}" is active.`;
        const features: string[] = [];
        if (found.receipts) features.push("receipts");
        if (found.customer_invoice) features.push("invoices");
        if (features.length) message += ` Enabled: ${features.join(", ")}.`;
      } else {
        message += ` Warning: No configuration found for fiscal ID "${fiscalId}".`;
      }
    }

    return { success: true, message, configurations: configs };
  } catch (error: any) {
    return {
      success: false,
      message: `Connection to OpenAPI.com failed: ${error.message}`,
    };
  }
}
