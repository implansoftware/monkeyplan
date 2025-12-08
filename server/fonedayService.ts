import { FonedayCredential } from "@shared/schema";

const FONEDAY_BASE_URL = "https://foneday.shop/api/v1";

interface FonedayApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface FonedayCategory {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
}

interface FonedayProduct {
  id: number;
  sku: string;
  name: string;
  brand: string;
  model: string;
  category_id: number;
  category_name: string;
  price: number;
  stock: number;
  ean: string;
  image_url: string;
  description: string;
  warranty_months: number;
}

interface FonedayProductDetail extends FonedayProduct {
  specifications: Record<string, string>;
  compatible_models: string[];
}

interface FonedayCartItem {
  id: number;
  product_id: number;
  product_sku: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  stock: number;
}

interface FonedayCart {
  items: FonedayCartItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
}

interface FonedayShippingMethod {
  id: string;
  name: string;
  price: number;
  estimated_days: string;
}

interface FonedayOrderResponse {
  order_id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
}

interface FonedayOrder {
  order_id: string;
  order_number: string;
  status: string;
  items: FonedayCartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  created_at: string;
  updated_at: string;
  tracking_number?: string;
  tracking_url?: string;
}

interface FonedayAddress {
  name: string;
  company?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  country_code: string;
  phone: string;
  email: string;
}

interface FonedayInvoice {
  invoice_id: string;
  invoice_number: string;
  order_id: string;
  order_number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  pdf_url?: string;
}

export class FonedayService {
  private credential: FonedayCredential;
  private baseUrl: string;

  constructor(credential: FonedayCredential) {
    this.credential = credential;
    this.baseUrl = FONEDAY_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: Record<string, any>,
    queryParams?: Record<string, string>
  ): Promise<FonedayApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.credential.apiToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url.toString(), options);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP Error ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        return {
          success: false,
          message: errorMessage,
        };
      }

      const json = await response.json();
      return {
        success: true,
        data: json,
      };
    } catch (error: any) {
      console.error("Foneday API Error:", error);
      return {
        success: false,
        message: error.message || "Errore di connessione",
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.request<{ user: any }>("/v1/account");
      if (result.success) {
        return { success: true, message: "Connessione riuscita" };
      }
      return { success: false, message: result.message || "Errore sconosciuto" };
    } catch (error: any) {
      return { success: false, message: error.message || "Errore di connessione" };
    }
  }

  async getCategories(): Promise<FonedayCategory[]> {
    const result = await this.request<{ categories: FonedayCategory[] }>("/v1/categories");
    if (result.success && result.data) {
      return result.data.categories || [];
    }
    throw new Error(result.message || "Errore nel recupero categorie");
  }

  async searchProducts(params: {
    query?: string;
    category_id?: number;
    brand?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ products: FonedayProduct[]; total: number; page: number; per_page: number }> {
    const queryParams: Record<string, string> = {};
    if (params.query) queryParams.search = params.query;
    if (params.category_id) queryParams.category_id = String(params.category_id);
    if (params.brand) queryParams.brand = params.brand;
    if (params.page) queryParams.page = String(params.page);
    if (params.per_page) queryParams.per_page = String(params.per_page);

    const result = await this.request<{
      products: FonedayProduct[];
      meta: { total: number; page: number; per_page: number };
    }>("/v1/products", "GET", undefined, queryParams);

    if (result.success && result.data) {
      return {
        products: result.data.products || [],
        total: result.data.meta?.total || 0,
        page: result.data.meta?.page || 1,
        per_page: result.data.meta?.per_page || 20,
      };
    }
    throw new Error(result.message || "Errore nella ricerca prodotti");
  }

  async getProduct(productId: number): Promise<FonedayProductDetail> {
    const result = await this.request<{ product: FonedayProductDetail }>(
      `/v1/products/${productId}`
    );
    if (result.success && result.data?.product) {
      return result.data.product;
    }
    throw new Error(result.message || "Prodotto non trovato");
  }

  async getBrands(): Promise<string[]> {
    const result = await this.request<{ brands: string[] }>("/v1/brands");
    if (result.success && result.data) {
      return result.data.brands || [];
    }
    throw new Error(result.message || "Errore nel recupero marchi");
  }

  async getCart(): Promise<FonedayCart> {
    const result = await this.request<{ cart: FonedayCart }>("/v1/cart");
    if (result.success && result.data) {
      return result.data.cart || { items: [], subtotal: 0, tax: 0, total: 0, currency: "EUR" };
    }
    throw new Error(result.message || "Errore nel recupero carrello");
  }

  async addToCart(productId: number, quantity: number): Promise<boolean> {
    const result = await this.request(
      "/v1/cart/items",
      "POST",
      { product_id: productId, quantity }
    );
    if (!result.success) {
      throw new Error(result.message || "Errore nell'aggiunta al carrello");
    }
    return true;
  }

  async updateCartItem(itemId: number, quantity: number): Promise<boolean> {
    const result = await this.request(
      `/v1/cart/items/${itemId}`,
      "PUT",
      { quantity }
    );
    if (!result.success) {
      throw new Error(result.message || "Errore nell'aggiornamento carrello");
    }
    return true;
  }

  async removeFromCart(itemId: number): Promise<boolean> {
    const result = await this.request(
      `/v1/cart/items/${itemId}`,
      "DELETE"
    );
    if (!result.success) {
      throw new Error(result.message || "Errore nella rimozione dal carrello");
    }
    return true;
  }

  async clearCart(): Promise<boolean> {
    const result = await this.request("/v1/cart", "DELETE");
    if (!result.success) {
      throw new Error(result.message || "Errore nello svuotamento carrello");
    }
    return true;
  }

  async getShippingMethods(): Promise<FonedayShippingMethod[]> {
    const result = await this.request<{ shipping_methods: FonedayShippingMethod[] }>(
      "/v1/shipping-methods"
    );
    if (result.success && result.data) {
      return result.data.shipping_methods || [];
    }
    throw new Error(result.message || "Errore nel recupero metodi di spedizione");
  }

  async submitOrder(
    shippingMethodId: string,
    shippingAddress: FonedayAddress,
    notes?: string
  ): Promise<FonedayOrderResponse> {
    const result = await this.request<{ order: FonedayOrderResponse }>(
      "/v1/orders",
      "POST",
      {
        shipping_method_id: shippingMethodId,
        shipping_address: shippingAddress,
        notes,
      }
    );
    if (result.success && result.data?.order) {
      return result.data.order;
    }
    throw new Error(result.message || "Errore nell'invio ordine");
  }

  async getOrders(page: number = 1, perPage: number = 20): Promise<{ orders: FonedayOrder[]; total: number }> {
    const result = await this.request<{
      orders: FonedayOrder[];
      meta: { total: number; page: number; per_page: number };
    }>("/v1/orders", "GET", undefined, {
      page: String(page),
      per_page: String(perPage),
    });
    if (result.success && result.data) {
      return {
        orders: result.data.orders || [],
        total: result.data.meta?.total || 0,
      };
    }
    throw new Error(result.message || "Errore nel recupero ordini");
  }

  async getOrder(orderId: string): Promise<FonedayOrder> {
    const result = await this.request<{ order: FonedayOrder }>(
      `/v1/orders/${orderId}`
    );
    if (result.success && result.data?.order) {
      return result.data.order;
    }
    throw new Error(result.message || "Ordine non trovato");
  }

  async getInvoices(page: number = 1, perPage: number = 20): Promise<{ invoices: FonedayInvoice[]; total: number }> {
    const result = await this.request<{
      invoices: FonedayInvoice[];
      meta: { total: number; page: number; per_page: number };
    }>("/v1/invoices", "GET", undefined, {
      page: String(page),
      per_page: String(perPage),
    });
    if (result.success && result.data) {
      return {
        invoices: result.data.invoices || [],
        total: result.data.meta?.total || 0,
      };
    }
    throw new Error(result.message || "Errore nel recupero fatture");
  }

  async getInvoice(invoiceId: string): Promise<FonedayInvoice> {
    const result = await this.request<{ invoice: FonedayInvoice }>(
      `/v1/invoices/${invoiceId}`
    );
    if (result.success && result.data?.invoice) {
      return result.data.invoice;
    }
    throw new Error(result.message || "Fattura non trovata");
  }

  async downloadInvoicePdf(invoiceId: string): Promise<{ url: string }> {
    const result = await this.request<{ pdf_url: string }>(
      `/v1/invoices/${invoiceId}/pdf`
    );
    if (result.success && result.data?.pdf_url) {
      return { url: result.data.pdf_url };
    }
    throw new Error(result.message || "PDF fattura non disponibile");
  }
}

export function createFonedayService(credential: FonedayCredential): FonedayService {
  return new FonedayService(credential);
}
