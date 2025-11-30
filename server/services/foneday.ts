/**
 * Foneday API Service
 * Gestisce tutte le chiamate all'API di Foneday per sincronizzazione catalogo,
 * ordini, carrello e fatture.
 * 
 * Base URL: https://foneday.shop/api/v1
 * Auth: Bearer Token
 */

const FONEDAY_BASE_URL = 'https://foneday.shop/api/v1';

export interface FonedayProduct {
  sku: string;
  ean: string | null;
  title: string;
  instock: 'Y' | 'N';
  suitable_for: string;
  category: string;
  product_brand: string | null;
  artcode: string | null;
  quality: string;
  model_brand: string;
  model_codes: string[];
  price: number;
}

export interface FonedayOrder {
  order_number: number;
  created_at: string;
  status: string;
  shipment_method: string;
  trackandtrace: string | null;
  total_incl_vat: string;
  paid: number;
  invoicenumber: string;
  amount_of_products: number;
  total_products: number;
}

export interface FonedayCartItem {
  sku: string;
  quantity: number;
  title: string;
  price: string;
  note: string | null;
}

export interface FonedayInvoice {
  number: number;
  created_at: string;
  companyname: string;
  vat_added: number;
  vatnumber: string;
  type: 'invoice' | 'creditnota';
  subtype: string;
  currency: string;
  amount: number;
  paid: boolean;
  order?: {
    order_number: number;
    daysUnpaid: number;
  };
  rma?: {
    nummer: string;
  };
}

export interface FonedayAddCartRequest {
  articles: {
    sku: string;
    quantity: number;
    note?: string | null;
  }[];
}

export interface FonedayRemoveCartRequest {
  articles: {
    sku: string;
    quantity: number;
  }[];
}

class FonedayApiService {
  private getToken(): string {
    const token = process.env.FONEDAY_API_TOKEN;
    if (!token) {
      throw new Error('Token API Foneday non configurato. Imposta FONEDAY_API_TOKEN nei Secrets.');
    }
    return token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    
    const response = await fetch(`${FONEDAY_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Errore API Foneday (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Test della connessione API
   */
  async testConnection(): Promise<{ success: boolean; message: string; productsCount?: number }> {
    try {
      const result = await this.getProducts();
      return {
        success: true,
        message: 'Connessione riuscita',
        productsCount: result.products.length,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Errore sconosciuto',
      };
    }
  }

  /**
   * Ottiene l'intero catalogo prodotti
   */
  async getProducts(): Promise<{ products: FonedayProduct[] }> {
    return this.request<{ products: FonedayProduct[] }>('/products');
  }

  /**
   * Ottiene un singolo prodotto per SKU
   */
  async getProduct(sku: string): Promise<{ product: FonedayProduct }> {
    return this.request<{ product: FonedayProduct }>(`/product/${encodeURIComponent(sku)}`);
  }

  /**
   * Ottiene gli ultimi 100 ordini
   */
  async getOrders(): Promise<{ orders: FonedayOrder[] }> {
    return this.request<{ orders: FonedayOrder[] }>('/orders');
  }

  /**
   * Aggiunge articoli al carrello
   */
  async addToCart(request: FonedayAddCartRequest): Promise<{ cart: FonedayCartItem[] }> {
    return this.request<{ cart: FonedayCartItem[] }>('/shopping-cart-add-items', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Rimuove articoli dal carrello
   */
  async removeFromCart(request: FonedayRemoveCartRequest): Promise<{ cart: FonedayCartItem[] }> {
    return this.request<{ cart: FonedayCartItem[] }>('/shopping-cart-remove-items', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Ottiene le ultime 100 fatture
   */
  async getInvoices(): Promise<{ invoices: FonedayInvoice[] }> {
    return this.request<{ invoices: FonedayInvoice[] }>('/invoices');
  }

  /**
   * Ottiene il PDF di una fattura in Base64
   */
  async getInvoicePdf(invoiceNumber: number): Promise<{ pdf: string }> {
    return this.request<{ pdf: string }>(`/invoices/pdf/${invoiceNumber}`);
  }

  /**
   * Ottiene una fattura in formato XML/UBL
   */
  async getInvoiceXml(invoiceNumber: number): Promise<string> {
    const token = this.getToken();
    
    const response = await fetch(`${FONEDAY_BASE_URL}/invoices/xml/${invoiceNumber}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`Errore recupero XML fattura: ${response.status}`);
    }

    return response.text();
  }
}

export const fonedayApi = new FonedayApiService();
