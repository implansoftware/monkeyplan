import type { PosTransaction, PosTransactionItem } from "@shared/schema";

export interface RTReceiptData {
  transaction: PosTransaction;
  items: PosTransactionItem[];
  operatorName: string;
  repairCenterName: string;
  repairCenterVatNumber?: string;
  repairCenterAddress?: string;
}

export interface RTSubmissionResult {
  success: boolean;
  submissionId?: string;
  documentUrl?: string;
  errorMessage?: string;
  rawResponse?: any;
}

export interface RTProviderConfig {
  apiKey: string;
  apiSecret: string;
  endpoint?: string;
  deviceId?: string;
  sandboxMode?: boolean;
}

export interface IFiscalRTProvider {
  name: string;
  submitReceipt(data: RTReceiptData, config: RTProviderConfig): Promise<RTSubmissionResult>;
  cancelReceipt(submissionId: string, config: RTProviderConfig): Promise<RTSubmissionResult>;
  testConnection(config: RTProviderConfig): Promise<{ success: boolean; message: string }>;
  getStatus(submissionId: string, config: RTProviderConfig): Promise<{ status: string; details?: any }>;
}

class SandboxRTProvider implements IFiscalRTProvider {
  name = "sandbox";

  async submitReceipt(data: RTReceiptData, _config: RTProviderConfig): Promise<RTSubmissionResult> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const submissionId = `SB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    console.log(`[RT Sandbox] Documento trasmesso: ${data.transaction.transactionNumber} → ${submissionId}`);
    console.log(`[RT Sandbox] Tipo: ${data.transaction.documentType}, Totale: €${(data.transaction.total / 100).toFixed(2)}`);
    console.log(`[RT Sandbox] Articoli: ${data.items.length}, Lotteria: ${data.transaction.lotteryCode || 'N/A'}`);

    return {
      success: true,
      submissionId,
      documentUrl: `https://sandbox.rt-provider.example/docs/${submissionId}`,
    };
  }

  async cancelReceipt(submissionId: string, _config: RTProviderConfig): Promise<RTSubmissionResult> {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`[RT Sandbox] Annullamento documento: ${submissionId}`);
    return {
      success: true,
      submissionId,
    };
  }

  async testConnection(_config: RTProviderConfig): Promise<{ success: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      success: true,
      message: "Connessione sandbox OK. Modalità test attiva — i documenti non vengono trasmessi all'Agenzia delle Entrate.",
    };
  }

  async getStatus(submissionId: string, _config: RTProviderConfig): Promise<{ status: string; details?: any }> {
    return {
      status: "confirmed",
      details: { submissionId, provider: "sandbox", note: "Sandbox mode - always confirmed" },
    };
  }
}

class FiskalyRTProvider implements IFiscalRTProvider {
  name = "fiskaly";

  private async apiRequest(method: string, path: string, config: RTProviderConfig, body?: any): Promise<any> {
    const baseUrl = config.endpoint || (config.sandboxMode
      ? "https://sign-it.fiskaly.com/api/v1"
      : "https://sign-it.fiskaly.com/api/v1");

    const authHeader = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64");

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(responseData.message || responseData.error || `fiskaly API error: ${res.status}`);
    }

    return responseData;
  }

  async submitReceipt(data: RTReceiptData, config: RTProviderConfig): Promise<RTSubmissionResult> {
    try {
      const items = data.items.map(item => ({
        description: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        vat_rate: item.vatRate ?? 22,
      }));

      const payload = {
        type: data.transaction.documentType === "invoice" ? "invoice" : "receipt",
        items,
        total: data.transaction.total,
        tax_amount: data.transaction.taxAmount,
        payment_method: data.transaction.paymentMethod,
        lottery_code: data.transaction.lotteryCode || undefined,
        daily_number: data.transaction.dailyNumber,
        operator: data.operatorName,
        business_name: data.repairCenterName,
        vat_number: data.repairCenterVatNumber,
        address: data.repairCenterAddress,
        timestamp: new Date().toISOString(),
      };

      const result = await this.apiRequest("POST", "/receipts", config, payload);

      return {
        success: true,
        submissionId: result.id || result.receipt_id,
        documentUrl: result.document_url,
        rawResponse: result,
      };
    } catch (error: any) {
      return {
        success: false,
        errorMessage: error.message || "Errore sconosciuto durante l'invio a fiskaly",
      };
    }
  }

  async cancelReceipt(submissionId: string, config: RTProviderConfig): Promise<RTSubmissionResult> {
    try {
      const result = await this.apiRequest("POST", `/receipts/${submissionId}/cancel`, config);
      return {
        success: true,
        submissionId,
        rawResponse: result,
      };
    } catch (error: any) {
      return {
        success: false,
        errorMessage: error.message || "Errore durante l'annullamento",
      };
    }
  }

  async testConnection(config: RTProviderConfig): Promise<{ success: boolean; message: string }> {
    try {
      await this.apiRequest("GET", "/health", config);
      return {
        success: true,
        message: `Connessione a fiskaly ${config.sandboxMode ? "(sandbox)" : "(produzione)"} riuscita.`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Connessione a fiskaly fallita: ${error.message}`,
      };
    }
  }

  async getStatus(submissionId: string, config: RTProviderConfig): Promise<{ status: string; details?: any }> {
    try {
      const result = await this.apiRequest("GET", `/receipts/${submissionId}`, config);
      return {
        status: result.status || "unknown",
        details: result,
      };
    } catch (error: any) {
      return {
        status: "error",
        details: { error: error.message },
      };
    }
  }
}

const providers: Record<string, IFiscalRTProvider> = {
  sandbox: new SandboxRTProvider(),
  fiskaly: new FiskalyRTProvider(),
};

export function getProvider(providerName: string): IFiscalRTProvider | null {
  return providers[providerName] || null;
}

export function getAvailableProviders(): Array<{ id: string; name: string; description: string }> {
  return [
    { id: "none", name: "Nessuno", description: "RT non attivo" },
    { id: "sandbox", name: "Sandbox (Test)", description: "Modalità test — documenti simulati, nessuna trasmissione reale" },
    { id: "fiskaly", name: "fiskaly SIGN IT", description: "Provider cloud certificato per corrispettivi telematici" },
  ];
}

export async function submitTransactionToRT(
  data: RTReceiptData,
  providerName: string,
  config: RTProviderConfig
): Promise<RTSubmissionResult> {
  const provider = getProvider(providerName);
  if (!provider) {
    return { success: false, errorMessage: `Provider RT "${providerName}" non trovato` };
  }
  return provider.submitReceipt(data, config);
}

export async function testRTConnection(
  providerName: string,
  config: RTProviderConfig
): Promise<{ success: boolean; message: string }> {
  const provider = getProvider(providerName);
  if (!provider) {
    return { success: false, message: `Provider RT "${providerName}" non trovato` };
  }
  return provider.testConnection(config);
}
