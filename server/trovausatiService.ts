import { TrovausatiCredential } from "@shared/schema";

const TROVAUSATI_BASE_URL = "https://www.trovausati.it/api";

interface TrovausatiApiResponse<T> {
  data?: T;
  errors?: {
    code: string;
    status: string;
    title: string;
    detail: string;
  };
  meta?: {
    pagination?: {
      total: number;
      current: number;
      max: number;
      page_size: number;
    };
  };
}

interface TrovausatiDeviceModel {
  id: number;
  brand: string;
  model: string;
  label: string;
  type: string;
  model_base: string;
  variant: string;
}

interface TrovausatiModelDetail {
  type: "device";
  id: number;
  attributes: {
    updated_at: string;
    brand: string;
    model: string;
    models_list: string;
    model_base: string;
    variant: string;
    type: string;
    image: string;
    flag: number;
    price: number;
    prices?: {
      never_used: number;
      great: number;
      good: number;
      average: number;
      shop: number;
      public: number;
    };
    images?: Array<{
      url: string;
      color: string;
      ean?: string;
    }>;
    anomalies?: Array<{
      description: string;
      percentage: number;
      price: number;
    }>;
    supervaluation?: {
      type: string;
      id: number;
      attributes: {
        price: number;
        description: string;
        expires_at: string;
        terms_url: string;
      };
    };
  };
}

interface TrovausatiMarketplaceProduct {
  type: "product";
  id: number;
  attributes: {
    brand: string;
    model: string;
    full_price: number;
    price: number;
    vat_type: number;
    image_url: string;
    color: string;
    description: string;
    condition: string;
    screen_condition: string;
    battery_condition: string;
    battery_perc: number;
    accessories: string;
    warranty: string;
    purchase_proof_data: string;
    anomalies: string;
  };
}

interface TrovausatiMarketOrder {
  type: "market_order";
  id: number;
  attributes: {
    status: "pending" | "confirmed" | "shipped" | "delivered";
    reference: string;
    address: {
      city: string;
      province: string;
      zipCode: string;
      street: string;
      number: string;
    };
    shipment?: {
      code: string;
      carrier: string;
      shippingMark: boolean;
      pdf: string;
    };
    custom_flag: boolean;
    total_products: number;
    price: number;
    products: Array<{
      id: number;
      type: "market_order_item";
      properties: {
        brand: string;
        model: string;
        color: string;
        image_url: string;
        full_price: number;
        price: number;
        vat_type: string;
        description: string;
        condition: string;
        screen_condition: string;
        battery_condition: string;
        battery_perc: number;
        accessories: string;
        warranty: string;
        purchase_proof_data: string;
        anomalies: string;
      };
    }>;
  };
}

interface TrovausatiCoupon {
  type: "coupon";
  id: string;
  attributes: {
    created_at: string;
    value: number;
    status: "issued" | "used" | "cancelled" | "expired";
    coupon_code: string;
    barcode?: string;
    brand: string;
    model: string;
    imei_or_sn: string;
    shop_id?: string;
    consumed_at?: string | null;
    consumed_id?: string | null;
  };
}

interface TrovausatiAccessToken {
  type: "access_token";
  id: number;
  attributes: {
    token: string;
    url: string;
  };
}

export class TrovausatiService {
  private credential: TrovausatiCredential;
  private shopId?: string;

  constructor(credential: TrovausatiCredential, shopId?: string) {
    this.credential = credential;
    this.shopId = shopId;
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
    body?: Record<string, any>
  ): Promise<TrovausatiApiResponse<T>> {
    const url = `${TROVAUSATI_BASE_URL}/${endpoint}`;

    const headers: Record<string, string> = {
      "X-Authorization": this.credential.apiKey,
      "Content-Type": "application/json",
      "Accept": "application/vnd.api+json",
    };

    if (this.shopId) {
      headers["X-Shop-Id"] = this.shopId;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "PATCH")) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          errors: {
            code: response.status.toString(),
            status: response.status.toString(),
            title: response.statusText,
            detail: errorData.errors?.detail || `HTTP Error ${response.status}`,
          },
        };
      }

      const json = await response.json();
      return json;
    } catch (error: any) {
      console.error("TrovaUsati API Error:", error);
      return {
        errors: {
          code: "-1",
          status: "error",
          title: "Connection Error",
          detail: error.message || "Errore di connessione",
        },
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (this.credential.apiType === "resellers") {
        const result = await this.request<TrovausatiDeviceModel[]>("models/list");
        if (!result.errors) {
          return { success: true, message: "Connessione riuscita (Resellers API)" };
        }
        return { success: false, message: result.errors.detail || "Errore sconosciuto" };
      } else {
        const result = await this.request<TrovausatiDeviceModel[]>("stores/models");
        if (!result.errors) {
          return { success: true, message: "Connessione riuscita (Stores API)" };
        }
        return { success: false, message: result.errors.detail || "Errore sconosciuto" };
      }
    } catch (error: any) {
      return { success: false, message: error.message || "Errore di connessione" };
    }
  }

  async getModels(filters?: { brand?: string; type?: string; search?: string }): Promise<TrovausatiDeviceModel[]> {
    let endpoint = this.credential.apiType === "resellers" ? "models/list" : "stores/models";
    const params = new URLSearchParams();
    
    if (filters?.brand) params.append("brand", filters.brand);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.search) params.append("model_search", filters.search);
    
    const queryString = params.toString();
    if (queryString) endpoint += `?${queryString}`;

    const result = await this.request<TrovausatiDeviceModel[]>(endpoint);
    if (result.errors) {
      throw new Error(result.errors.detail || "Errore nel recupero modelli");
    }
    return result.data || [];
  }

  async getModelValuation(modelId: number, ean?: string): Promise<TrovausatiModelDetail> {
    let endpoint = this.credential.apiType === "resellers" 
      ? `models/${modelId}` 
      : `stores/models/${modelId}`;
    
    if (ean) endpoint += `?ean=${ean}`;

    const result = await this.request<TrovausatiModelDetail>(endpoint);
    if (result.errors) {
      throw new Error(result.errors.detail || "Errore nel recupero valutazione");
    }
    return result.data!;
  }

  async getMarketplaceProducts(page: number = 0, limit: number = 25): Promise<TrovausatiMarketplaceProduct[]> {
    if (!this.credential.marketplaceId) {
      throw new Error("Marketplace ID non configurato");
    }
    
    const endpoint = `marketplace/${this.credential.marketplaceId}/products?page=${page}&limit=${limit}`;
    const result = await this.request<TrovausatiMarketplaceProduct[]>(endpoint);
    
    if (result.errors) {
      throw new Error(result.errors.detail || "Errore nel recupero prodotti");
    }
    return result.data || [];
  }

  async getAggregatedProducts(type: "prime" = "prime"): Promise<any[]> {
    if (!this.credential.marketplaceId) {
      throw new Error("Marketplace ID non configurato");
    }
    
    const endpoint = `marketplace/${this.credential.marketplaceId}/compact/${type}/products`;
    const result = await this.request<any[]>(endpoint);
    
    if (result.errors) {
      throw new Error(result.errors.detail || "Errore nel recupero prodotti aggregati");
    }
    return result.data || [];
  }

  async orderProducts(productIds: number[], reference?: string): Promise<TrovausatiMarketOrder> {
    if (!this.credential.marketplaceId) {
      throw new Error("Marketplace ID non configurato");
    }
    
    const endpoint = `marketplace/${this.credential.marketplaceId}/products/order`;
    const result = await this.request<TrovausatiMarketOrder>(endpoint, "POST", {
      product_ids: productIds,
      reference: reference || null,
    });
    
    if (result.errors) {
      throw new Error(result.errors.detail || "Errore nell'ordinare prodotti");
    }
    return result.data!;
  }

  async getOrders(page: number = 0): Promise<any[]> {
    if (!this.credential.marketplaceId) {
      throw new Error("Marketplace ID non configurato");
    }
    
    const endpoint = `marketplace/${this.credential.marketplaceId}/orders?page=${page}`;
    const result = await this.request<any[]>(endpoint);
    
    if (result.errors) {
      throw new Error(result.errors.detail || "Errore nel recupero ordini");
    }
    return result.data || [];
  }

  async uploadTrackingCode(orderId: string, carrierCode: string, trackingCode: string): Promise<boolean> {
    if (!this.credential.marketplaceId) {
      throw new Error("Marketplace ID non configurato");
    }
    
    const endpoint = `marketplace/${this.credential.marketplaceId}/orders/${orderId}/tracking`;
    const result = await this.request(endpoint, "POST", {
      carrier: carrierCode,
      tracking_code: trackingCode,
    });
    
    if (result.errors) {
      throw new Error(result.errors.detail || "Errore nel caricamento tracking");
    }
    return true;
  }

  async getCoupons(filters?: { 
    page?: number; 
    pageSize?: number; 
    from?: string; 
    to?: string; 
    status?: string;
    id?: string;
  }): Promise<{ coupons: TrovausatiCoupon[]; pagination?: any }> {
    const params = new URLSearchParams();
    if (filters?.page !== undefined) params.append("page", filters.page.toString());
    if (filters?.pageSize) params.append("pageSize", filters.pageSize.toString());
    if (filters?.from) params.append("from", filters.from);
    if (filters?.to) params.append("to", filters.to);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.id) params.append("id", filters.id);

    const endpoint = `coupons?${params.toString()}`;
    const result = await this.request<TrovausatiCoupon[]>(endpoint);
    
    if (result.errors) {
      throw new Error(result.errors.detail || "Errore nel recupero coupon");
    }
    return { 
      coupons: result.data || [],
      pagination: result.meta?.pagination,
    };
  }

  async getCoupon(code: string): Promise<TrovausatiCoupon> {
    const endpoint = `coupons/${code}`;
    const result = await this.request<TrovausatiCoupon>(endpoint);
    
    if (result.errors) {
      throw new Error(result.errors.detail || "Coupon non trovato");
    }
    return result.data!;
  }

  async consumeCoupon(code: string): Promise<TrovausatiCoupon> {
    if (!this.shopId) {
      throw new Error("Shop ID non configurato");
    }
    
    const endpoint = `coupons/${code}/consume`;
    const result = await this.request<TrovausatiCoupon>(endpoint, "PATCH");
    
    if (result.errors) {
      throw new Error(result.errors.detail || "Errore nel consumo coupon");
    }
    return result.data!;
  }

  async cancelCoupon(code: string): Promise<TrovausatiCoupon> {
    if (!this.shopId) {
      throw new Error("Shop ID non configurato");
    }
    
    const endpoint = `coupons/${code}/cancel`;
    const result = await this.request<TrovausatiCoupon>(endpoint, "PATCH");
    
    if (result.errors) {
      throw new Error(result.errors.detail || "Errore nell'annullamento coupon");
    }
    return result.data!;
  }

  async getAccessToken(): Promise<TrovausatiAccessToken> {
    if (!this.shopId) {
      throw new Error("Shop ID non configurato");
    }
    
    const endpoint = "access-token";
    const result = await this.request<TrovausatiAccessToken>(endpoint);
    
    if (result.errors) {
      throw new Error(result.errors.detail || "Errore nel recupero access token");
    }
    return result.data!;
  }

  async getSupervaluations(ean: string): Promise<any[]> {
    const endpoint = `stores/supervaluations?ean=${ean}`;
    const result = await this.request<any[]>(endpoint);
    
    if (result.errors) {
      throw new Error(result.errors.detail || "Errore nel recupero supervalutazioni");
    }
    return result.data || [];
  }
}

export function createTrovausatiService(credential: TrovausatiCredential, shopId?: string): TrovausatiService {
  return new TrovausatiService(credential, shopId);
}
