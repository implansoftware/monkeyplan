import type { PosTransaction, PosTransactionItem } from "@shared/schema";
import { randomUUID } from "crypto";

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
  entityId?: string;
  systemId?: string;
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

const FISKALY_API_VERSION = "2025-08-12";

interface FiskalyTokenCache {
  accessToken: string;
  expiresAt: number;
  configHash: string;
}

class FiskalyRTProvider implements IFiscalRTProvider {
  name = "fiskaly";
  private tokenCache: FiskalyTokenCache | null = null;

  private getBaseUrl(config: RTProviderConfig): string {
    if (config.endpoint) return config.endpoint;
    return config.sandboxMode
      ? "https://test.api.fiskaly.com"
      : "https://live.api.fiskaly.com";
  }

  private getConfigHash(config: RTProviderConfig): string {
    return `${config.apiKey}:${config.sandboxMode ? 'test' : 'live'}`;
  }

  private async getAccessToken(config: RTProviderConfig): Promise<string> {
    const configHash = this.getConfigHash(config);

    if (
      this.tokenCache &&
      this.tokenCache.configHash === configHash &&
      this.tokenCache.expiresAt > Date.now() + 30000
    ) {
      return this.tokenCache.accessToken;
    }

    const baseUrl = this.getBaseUrl(config);
    const res = await fetch(`${baseUrl}/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Version": FISKALY_API_VERSION,
        "X-Idempotency-Key": randomUUID(),
      },
      body: JSON.stringify({
        content: {
          type: "API_KEY",
          key: config.apiKey,
          secret: config.apiSecret,
        },
      }),
    });

    const rawText = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error(`[Fiskaly] Risposta non-JSON dal token endpoint (HTTP ${res.status}):`, rawText.substring(0, 500));
    }

    if (!res.ok) {
      console.error(`[Fiskaly] Autenticazione fallita (HTTP ${res.status}):`, JSON.stringify(data));
      const errDetail = data?.content?.message || data?.message || data?.error || `Errore autenticazione Fiskaly: HTTP ${res.status}`;
      throw new Error(errDetail);
    }

    const accessToken = data?.content?.authentication?.bearer;
    if (!accessToken) {
      throw new Error("Risposta Fiskaly non contiene il token bearer");
    }

    const expiresAt = data?.content?.authentication?.expires_at;
    const expiresIn = expiresAt ? Math.max(60, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)) : 900;
    this.tokenCache = {
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
      configHash,
    };

    return accessToken;
  }

  private async apiRequest(
    method: string,
    path: string,
    config: RTProviderConfig,
    body?: any,
    idempotencyKey?: string
  ): Promise<any> {
    const baseUrl = this.getBaseUrl(config);
    const token = await this.getAccessToken(config);

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Api-Version": FISKALY_API_VERSION,
    };

    if (idempotencyKey && (method === "POST" || method === "PATCH")) {
      headers["X-Idempotency-Key"] = idempotencyKey;
    }

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errDetail = responseData?.content?.message || responseData?.message || responseData?.error || JSON.stringify(responseData);
      throw new Error(`Fiskaly API ${method} ${path} fallito (HTTP ${res.status}): ${errDetail}`);
    }

    return responseData;
  }

  private mapVatRateCode(vatRate: number): string {
    if (vatRate >= 22) return "STANDARD";
    if (vatRate >= 10) return "REDUCED_1";
    if (vatRate >= 5) return "REDUCED_2";
    return "REDUCED_3";
  }

  private formatDecimal(value: number): string {
    return value.toFixed(2);
  }

  private buildFiskalyEntries(data: RTReceiptData): any[] {
    const entries: any[] = [];
    let entryNumber = 1;
    const discountRatio = data.transaction.discountAmount
      ? 1 - (data.transaction.discountAmount / 100) / (data.transaction.subtotal / 100)
      : 1;

    for (const item of data.items) {
      const vatRate = item.vatRate ?? 22;
      const unitPriceInclVat = item.totalPrice / item.quantity / 100;
      const totalInclVat = (item.totalPrice / 100) * discountRatio;
      const totalExclVat = totalInclVat / (1 + vatRate / 100);
      const vatAmount = totalInclVat - totalExclVat;
      const baseValue = totalExclVat;

      const entry: any = {
        type: "SALE",
        data: {
          type: "ITEM",
          text: item.productName || "Articolo",
          unit: {
            quantity: this.formatDecimal(item.quantity),
            price: this.formatDecimal(unitPriceInclVat),
          },
          value: {
            base: this.formatDecimal(baseValue),
          },
          vat: {
            type: "VAT_RATE",
            code: this.mapVatRateCode(vatRate),
            percentage: this.formatDecimal(vatRate),
            amount: this.formatDecimal(vatAmount),
            exclusive: this.formatDecimal(totalExclVat),
            inclusive: this.formatDecimal(totalInclVat),
          },
        },
        details: {
          concept: "GOOD",
          number: entryNumber,
        },
      };

      if (discountRatio < 1) {
        const discountAmt = (item.totalPrice / 100) * (1 - discountRatio);
        entry.data.value.discount = this.formatDecimal(discountAmt);
      }

      entries.push(entry);
      entryNumber++;
    }

    return entries;
  }

  private buildFiskalyPayments(data: RTReceiptData): any[] {
    const totalEur = data.transaction.total / 100;
    const method = data.transaction.paymentMethod;

    switch (method) {
      case "card":
      case "pos_terminal":
        return [{
          type: "CARD",
          details: { amount: this.formatDecimal(totalEur) },
          number: "****",
          kind: "DEBIT",
        }];
      case "stripe_link":
      case "paypal":
        return [{
          type: "ONLINE",
          details: { amount: this.formatDecimal(totalEur) },
          name: "Pagamento online",
        }];
      case "mixed":
        return [{
          type: "CASH",
          details: { amount: this.formatDecimal(totalEur) },
        }];
      case "cash":
      default:
        return [{
          type: "CASH",
          details: { amount: this.formatDecimal(totalEur) },
        }];
    }
  }

  private computeDocumentTotalVat(data: RTReceiptData): { amount: string; exclusive: string; inclusive: string } {
    let totalInclVat = 0;
    let totalExclVat = 0;
    const discountRatio = data.transaction.discountAmount
      ? 1 - (data.transaction.discountAmount / 100) / (data.transaction.subtotal / 100)
      : 1;

    for (const item of data.items) {
      const vatRate = item.vatRate ?? 22;
      const itemInclVat = (item.totalPrice / 100) * discountRatio;
      const itemExclVat = itemInclVat / (1 + vatRate / 100);
      totalInclVat += itemInclVat;
      totalExclVat += itemExclVat;
    }

    const vatAmount = totalInclVat - totalExclVat;

    return {
      amount: this.formatDecimal(vatAmount),
      exclusive: this.formatDecimal(totalExclVat),
      inclusive: this.formatDecimal(totalInclVat),
    };
  }

  async submitReceipt(data: RTReceiptData, config: RTProviderConfig): Promise<RTSubmissionResult> {
    try {
      if (!config.entityId) {
        return { success: false, errorMessage: "Entity ID Fiskaly non configurato. Configuralo nelle impostazioni RT." };
      }
      if (!config.systemId) {
        return { success: false, errorMessage: "System ID Fiskaly non configurato. Configuralo nelle impostazioni RT." };
      }

      const intentionPayload = {
        content: {
          type: "INTENTION",
          system: { id: config.systemId },
          operation: {
            type: "TRANSACTION",
          },
        },
      };

      const intentionResult = await this.apiRequest("POST", "/records", config, intentionPayload, randomUUID());
      const intentionId = intentionResult?.content?.id;
      if (!intentionId) {
        throw new Error("Fiskaly non ha restituito un ID per l'INTENTION record");
      }

      console.log(`[Fiskaly] INTENTION creata: ${intentionId}`);

      const entries = this.buildFiskalyEntries(data);
      const payments = this.buildFiskalyPayments(data);
      const totalVat = this.computeDocumentTotalVat(data);

      const transactionPayload: any = {
        content: {
          type: "TRANSACTION",
          record: { id: intentionId },
          operation: {
            type: "RECEIPT",
            document: {
              number: data.transaction.transactionNumber || data.transaction.dailyNumber?.toString() || "1",
              total_vat: totalVat,
            },
            entries,
            payments,
          },
        },
      };

      if (data.transaction.lotteryCode) {
        transactionPayload.content.operation.customer = {
          type: "EXTERNAL",
          code: data.transaction.lotteryCode,
        };
      }

      const result = await this.apiRequest("POST", "/records", config, transactionPayload, randomUUID());

      const recordId = result?.content?.id;
      const recordState = result?.content?.state;

      console.log(`[Fiskaly] Documento trasmesso: ${data.transaction.transactionNumber} → ${recordId} (state: ${recordState})`);

      return {
        success: true,
        submissionId: recordId,
        rawResponse: result,
      };
    } catch (error: any) {
      console.error(`[Fiskaly] Errore invio documento: ${error.message}`);
      return {
        success: false,
        errorMessage: error.message || "Errore sconosciuto durante l'invio a Fiskaly",
      };
    }
  }

  async cancelReceipt(submissionId: string, config: RTProviderConfig): Promise<RTSubmissionResult> {
    try {
      if (!config.systemId) {
        return { success: false, errorMessage: "System ID Fiskaly non configurato." };
      }

      const intentionPayload = {
        content: {
          type: "INTENTION",
          system: { id: config.systemId },
          operation: {
            type: "TRANSACTION",
          },
        },
      };

      const intentionResult = await this.apiRequest("POST", "/records", config, intentionPayload, randomUUID());
      const intentionId = intentionResult?.content?.id;
      if (!intentionId) {
        throw new Error("Fiskaly non ha restituito un ID per l'INTENTION record");
      }

      const abortPayload = {
        content: {
          type: "TRANSACTION",
          record: { id: intentionId },
          operation: {
            type: "ABORT",
          },
        },
      };

      const result = await this.apiRequest("POST", "/records", config, abortPayload, randomUUID());

      const recordId = result?.content?.id;
      console.log(`[Fiskaly] Annullamento documento: ${submissionId} → ${recordId}`);

      return {
        success: true,
        submissionId: recordId,
        rawResponse: result,
      };
    } catch (error: any) {
      return {
        success: false,
        errorMessage: error.message || "Errore durante l'annullamento Fiskaly",
      };
    }
  }

  async testConnection(config: RTProviderConfig): Promise<{ success: boolean; message: string }> {
    try {
      await this.getAccessToken(config);

      const env = config.sandboxMode ? "TEST" : "LIVE";
      let message = `Connessione a Fiskaly (${env}) riuscita. Token ottenuto con successo.`;

      if (config.entityId) {
        try {
          await this.apiRequest("GET", `/entities/${config.entityId}`, config);
          message += " Entity verificata.";
        } catch (e: any) {
          message += ` Attenzione: Entity ID non valido o non accessibile (${e.message}).`;
        }
      }

      if (config.systemId) {
        try {
          await this.apiRequest("GET", `/systems/${config.systemId}`, config);
          message += " System verificato.";
        } catch (e: any) {
          message += ` Attenzione: System ID non valido o non accessibile (${e.message}).`;
        }
      }

      return { success: true, message };
    } catch (error: any) {
      return {
        success: false,
        message: `Connessione a Fiskaly fallita: ${error.message}`,
      };
    }
  }

  async getStatus(submissionId: string, config: RTProviderConfig): Promise<{ status: string; details?: any }> {
    try {
      const result = await this.apiRequest("GET", `/records/${submissionId}`, config);

      let status = "unknown";
      if (result.compliance?.status === "COMPLIANT") {
        status = "confirmed";
      } else if (result.compliance?.status === "PENDING") {
        status = "pending";
      } else if (result.compliance?.status === "ERROR" || result.compliance?.status === "FAILED") {
        status = "failed";
      } else {
        status = result.compliance?.status?.toLowerCase() || "unknown";
      }

      return {
        status,
        details: {
          recordId: result.id,
          complianceStatus: result.compliance?.status,
          logs: result.logs,
          createdAt: result.created_at,
        },
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
    { id: "fiskaly", name: "Fiskaly SIGN IT", description: "Provider cloud certificato per corrispettivi telematici — API v" + FISKALY_API_VERSION },
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
