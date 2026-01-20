/**
 * Sibill API Service
 * Handles all communications with the Sibill Integration API
 * https://docs.sibill.com/api-reference/
 */

export type SibillEnvironment = 'development' | 'production';

export interface SibillApiConfig {
  apiToken: string;
  environment: SibillEnvironment;
}

interface SibillAmount {
  amount: string;
  currency: string;
}

export interface SibillApiCompany {
  id: string;
  name: string;
  vat_number?: string;
  country?: string;
  fiscal_regime?: string;
  subscriptions?: Array<{
    created_at: string;
    status: string;
  }>;
}

export interface SibillApiAccount {
  id: string;
  nickname?: string;
  currency?: string;
  current_balance?: SibillAmount;
  available_balance?: SibillAmount;
  credit_limit?: SibillAmount;
  balance_date?: string;
  created_at?: string;
}

export interface SibillApiCounterpart {
  id: string;
  company_name?: string;
  vat_number?: string;
  tax_number?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  province_code?: string;
  country?: string;
  destination_code?: string;
}

export interface SibillApiFlow {
  id: string;
  document_id: string;
  amount?: SibillAmount;
  expected_payment_date?: string;
  payment_date?: string;
  payment_method?: string;
  payment_status?: string;
  created_at?: string;
}

export interface SibillApiDocument {
  id: string;
  type?: string;
  direction?: string;
  number?: string;
  status?: string;
  format?: string;
  is_e_invoice?: boolean;
  gross_amount?: SibillAmount;
  vat_amount?: SibillAmount;
  counterpart?: SibillApiCounterpart;
  category?: { id: string; name: string };
  subcategory?: { id: string; name: string };
  flows?: SibillApiFlow[];
  notes?: string;
  creation_date?: string;
  delivery_date?: string;
  delivery_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SibillApiTransaction {
  id: string;
  account_id?: string;
  amount?: SibillAmount;
  description?: string;
  counterpart_name?: string;
  transaction_date?: string;
  value_date?: string;
  is_reconciled?: boolean;
  reconciliation_id?: string;
}

export interface SibillApiCategory {
  id: string;
  name: string;
}

interface PaginatedResponse<T> {
  data: T[];
  page?: {
    cursor?: string;
    size?: number;
  };
}

export class SibillService {
  private baseUrl: string;
  private token: string;

  constructor(config: SibillApiConfig) {
    this.token = config.apiToken;
    this.baseUrl = config.environment === 'production'
      ? 'https://integration.sibill.com'
      : 'https://integration.dev.sibill.com';
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Debug logging
    const maskedToken = this.token.length > 12
      ? this.token.slice(0, 8) + '...' + this.token.slice(-4)
      : '***';
    console.log(`[Sibill API] ${method} ${url}`);
    console.log(`[Sibill API] Token (masked): ${maskedToken}`);
    console.log(`[Sibill API] Token length: ${this.token.length} chars`);
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    console.log(`[Sibill API] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[Sibill API] Error response: ${errorText}`);
      throw new Error(`Sibill API error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  /**
   * Test connection by fetching companies list
   */
  async testConnection(): Promise<{ success: boolean; message: string; companiesCount?: number }> {
    try {
      const result = await this.listCompanies();
      return {
        success: true,
        message: `Connessione riuscita. Trovate ${result.length} aziende.`,
        companiesCount: result.length,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Errore di connessione sconosciuto',
      };
    }
  }

  /**
   * List all companies available for the integrator
   */
  async listCompanies(expand?: string): Promise<SibillApiCompany[]> {
    let endpoint = '/api/v1/companies';
    if (expand) {
      endpoint += `?expand=${expand}`;
    }
    const response = await this.request<{ data: SibillApiCompany[] }>('GET', endpoint);
    return response.data;
  }

  /**
   * List all accounts for a company
   */
  async listAccounts(companyId: string, pageSize?: number, cursor?: string): Promise<PaginatedResponse<SibillApiAccount>> {
    let endpoint = `/api/v1/companies/${companyId}/accounts`;
    const params = new URLSearchParams();
    if (pageSize) params.append('page_size', pageSize.toString());
    if (cursor) params.append('cursor', cursor);
    if (params.toString()) endpoint += `?${params.toString()}`;
    
    return this.request<PaginatedResponse<SibillApiAccount>>('GET', endpoint);
  }

  /**
   * Get a specific account
   */
  async getAccount(companyId: string, accountId: string): Promise<SibillApiAccount> {
    const response = await this.request<{ data: SibillApiAccount }>(
      'GET',
      `/api/v1/companies/${companyId}/accounts/${accountId}`
    );
    return response.data;
  }

  /**
   * List all categories for a company
   */
  async listCategories(companyId: string, pageSize?: number, cursor?: string): Promise<PaginatedResponse<SibillApiCategory>> {
    let endpoint = `/api/v1/companies/${companyId}/categories`;
    const params = new URLSearchParams();
    if (pageSize) params.append('page_size', pageSize.toString());
    if (cursor) params.append('cursor', cursor);
    if (params.toString()) endpoint += `?${params.toString()}`;
    
    return this.request<PaginatedResponse<SibillApiCategory>>('GET', endpoint);
  }

  /**
   * List all documents for a company
   */
  async listDocuments(
    companyId: string,
    options?: {
      pageSize?: number;
      cursor?: string;
      direction?: 'ISSUED' | 'RECEIVED';
      status?: string;
    }
  ): Promise<PaginatedResponse<SibillApiDocument>> {
    let endpoint = `/api/v1/companies/${companyId}/documents`;
    const params = new URLSearchParams();
    if (options?.pageSize) params.append('page_size', options.pageSize.toString());
    if (options?.cursor) params.append('cursor', options.cursor);
    if (options?.direction) params.append('filter[direction]', options.direction);
    if (options?.status) params.append('filter[status]', options.status);
    if (params.toString()) endpoint += `?${params.toString()}`;
    
    return this.request<PaginatedResponse<SibillApiDocument>>('GET', endpoint);
  }

  /**
   * Get a specific document
   */
  async getDocument(companyId: string, documentId: string): Promise<SibillApiDocument> {
    const response = await this.request<{ data: SibillApiDocument }>(
      'GET',
      `/api/v1/companies/${companyId}/documents/${documentId}`
    );
    return response.data;
  }

  /**
   * Create and issue an invoice
   */
  async createInvoice(companyId: string, invoiceData: unknown): Promise<SibillApiDocument> {
    const response = await this.request<{ data: SibillApiDocument }>(
      'POST',
      `/api/v1/companies/${companyId}/documents`,
      invoiceData
    );
    return response.data;
  }

  /**
   * List counterparts (customers/suppliers)
   */
  async listCounterparts(companyId: string, pageSize?: number, cursor?: string): Promise<PaginatedResponse<SibillApiCounterpart>> {
    let endpoint = `/api/v1/companies/${companyId}/counterparts`;
    const params = new URLSearchParams();
    if (pageSize) params.append('page_size', pageSize.toString());
    if (cursor) params.append('cursor', cursor);
    if (params.toString()) endpoint += `?${params.toString()}`;
    
    return this.request<PaginatedResponse<SibillApiCounterpart>>('GET', endpoint);
  }

  /**
   * List transactions for a company
   */
  async listTransactions(companyId: string, pageSize?: number, cursor?: string): Promise<PaginatedResponse<SibillApiTransaction>> {
    let endpoint = `/api/v1/companies/${companyId}/transactions`;
    const params = new URLSearchParams();
    if (pageSize) params.append('page_size', pageSize.toString());
    if (cursor) params.append('cursor', cursor);
    if (params.toString()) endpoint += `?${params.toString()}`;
    
    return this.request<PaginatedResponse<SibillApiTransaction>>('GET', endpoint);
  }

  /**
   * List reconciliations for a company
   */
  async listReconciliations(companyId: string, pageSize?: number, cursor?: string): Promise<PaginatedResponse<unknown>> {
    let endpoint = `/api/v1/companies/${companyId}/reconciliations`;
    const params = new URLSearchParams();
    if (pageSize) params.append('page_size', pageSize.toString());
    if (cursor) params.append('cursor', cursor);
    if (params.toString()) endpoint += `?${params.toString()}`;
    
    return this.request<PaginatedResponse<unknown>>('GET', endpoint);
  }

  /**
   * Helper to convert Sibill amount to cents
   */
  static amountToCents(amount?: SibillAmount): number | null {
    if (!amount?.amount) return null;
    return Math.round(parseFloat(amount.amount) * 100);
  }
}

export default SibillService;
