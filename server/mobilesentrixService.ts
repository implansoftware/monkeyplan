import { MobilesentrixCredential } from "@shared/schema";
import crypto from "crypto";

// MobileSentrix EU environments
// Production: https://www.mobilesentrix.eu
// Staging: https://preprod.mobilesentrix.eu
function getMobilesentrixBaseUrl(environment: string): string {
  if (environment === "staging") {
    return "https://preprod.mobilesentrix.eu/rest/V1";
  }
  return "https://www.mobilesentrix.eu/rest/V1";
}

interface MobilesentrixApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface MobilesentrixProduct {
  id: string;
  sku: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
  description: string;
}

interface MobilesentrixCategory {
  id: string;
  name: string;
  parent_id: string | null;
}

interface MobilesentrixCartItem {
  sku: string;
  quantity: number;
  price: number;
}

interface MobilesentrixOrderResponse {
  order_id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
}

interface MobilesentrixAddress {
  name: string;
  company?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
}

export class MobilesentrixService {
  private credential: MobilesentrixCredential;
  private baseUrl: string;

  constructor(credential: MobilesentrixCredential) {
    this.credential = credential;
    // Use environment from credential, default to production
    const environment = (credential as any).environment || "production";
    this.baseUrl = getMobilesentrixBaseUrl(environment);
  }

  private generateOAuthSignature(
    method: string,
    url: string,
    params: Record<string, string>,
    consumerSecret: string
  ): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join("&");

    const signatureBaseString = [
      method.toUpperCase(),
      encodeURIComponent(url),
      encodeURIComponent(sortedParams)
    ].join("&");

    const signingKey = `${encodeURIComponent(consumerSecret)}&`;

    const hmac = crypto.createHmac("sha1", signingKey);
    hmac.update(signatureBaseString);
    return hmac.digest("base64");
  }

  private generateOAuthHeader(
    method: string, 
    baseUrl: string, 
    queryParams?: Record<string, string>,
    bodyParams?: Record<string, any>
  ): string {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString("hex");

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: this.credential.consumerKey,
      oauth_nonce: nonce,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: timestamp,
      oauth_version: "1.0"
    };

    const allParams: Record<string, string> = { ...oauthParams };
    
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        allParams[key] = value;
      });
    }
    
    if (bodyParams && typeof bodyParams === 'object') {
      const flattenBody = (obj: any, prefix = ''): Record<string, string> => {
        const result: Record<string, string> = {};
        for (const key of Object.keys(obj)) {
          const value = obj[key];
          const fullKey = prefix ? `${prefix}[${key}]` : key;
          if (Array.isArray(value)) {
            value.forEach((item, index) => {
              if (typeof item === 'object' && item !== null) {
                Object.assign(result, flattenBody(item, `${fullKey}[${index}]`));
              } else {
                result[`${fullKey}[${index}]`] = String(item);
              }
            });
          } else if (typeof value === 'object' && value !== null) {
            Object.assign(result, flattenBody(value, fullKey));
          } else if (value !== undefined && value !== null) {
            result[fullKey] = String(value);
          }
        }
        return result;
      };
      Object.assign(allParams, flattenBody(bodyParams));
    }

    const signature = this.generateOAuthSignature(
      method,
      baseUrl,
      allParams,
      this.credential.consumerSecret
    );

    oauthParams["oauth_signature"] = signature;

    const authHeader = Object.keys(oauthParams)
      .sort()
      .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
      .join(", ");

    return `OAuth ${authHeader}`;
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: Record<string, any>,
    queryParams?: Record<string, string>
  ): Promise<MobilesentrixApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const authHeader = this.generateOAuthHeader(
      method, 
      url.origin + url.pathname, 
      queryParams,
      body
    );

    const headers: Record<string, string> = {
      "Authorization": authHeader,
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
      console.error("MobileSentrix API Error:", error);
      return {
        success: false,
        message: error.message || "Errore di connessione",
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Magento 2 REST API - test with store info endpoint
      const result = await this.request<any>("/store/storeConfigs", "GET");
      if (result.success) {
        return { success: true, message: "Connessione riuscita" };
      }
      return { success: false, message: result.message || "Errore sconosciuto" };
    } catch (error: any) {
      return { success: false, message: error.message || "Errore di connessione" };
    }
  }

  async getCategories(): Promise<MobilesentrixCategory[]> {
    // Magento 2 REST API - categories endpoint
    const result = await this.request<any>("/categories");
    if (result.success && result.data) {
      const extractCategories = (cat: any): MobilesentrixCategory[] => {
        const cats: MobilesentrixCategory[] = [{
          id: String(cat.id),
          name: cat.name,
          parent_id: cat.parent_id ? String(cat.parent_id) : null
        }];
        if (cat.children_data) {
          cat.children_data.forEach((child: any) => {
            cats.push(...extractCategories(child));
          });
        }
        return cats;
      };
      return extractCategories(result.data);
    }
    throw new Error(result.message || "Errore nel recupero categorie");
  }

  async searchProducts(params: {
    query?: string;
    category_id?: string;
    brand?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ products: MobilesentrixProduct[]; total: number; page: number; per_page: number }> {
    // Magento 2 REST API - uses searchCriteria format
    const queryParams: Record<string, string> = {};
    let filterIndex = 0;
    
    if (params.query) {
      // Search by name using LIKE
      queryParams[`searchCriteria[filterGroups][${filterIndex}][filters][0][field]`] = "name";
      queryParams[`searchCriteria[filterGroups][${filterIndex}][filters][0][value]`] = `%${params.query}%`;
      queryParams[`searchCriteria[filterGroups][${filterIndex}][filters][0][conditionType]`] = "like";
      filterIndex++;
    }
    
    if (params.category_id) {
      queryParams[`searchCriteria[filterGroups][${filterIndex}][filters][0][field]`] = "category_id";
      queryParams[`searchCriteria[filterGroups][${filterIndex}][filters][0][value]`] = params.category_id;
      filterIndex++;
    }

    const page = params.page || 1;
    const perPage = params.per_page || 20;
    queryParams["searchCriteria[currentPage]"] = String(page);
    queryParams["searchCriteria[pageSize]"] = String(perPage);

    const result = await this.request<any>("/products", "GET", undefined, queryParams);

    if (result.success && result.data) {
      const items = result.data.items || [];
      const products = items.map((p: any) => {
        // Extract custom attributes
        const getAttr = (code: string) => {
          const attr = p.custom_attributes?.find((a: any) => a.attribute_code === code);
          return attr?.value || "";
        };
        
        return {
          id: String(p.id),
          sku: p.sku || "",
          name: p.name || "",
          brand: getAttr("manufacturer") || getAttr("brand") || "",
          model: getAttr("model") || "",
          category: "",
          price: p.price || 0,
          stock: p.extension_attributes?.stock_item?.qty || 0,
          image_url: p.media_gallery_entries?.[0]?.file 
            ? `https://www.mobilesentrix.eu/media/catalog/product${p.media_gallery_entries[0].file}` 
            : "",
          description: getAttr("description") || getAttr("short_description") || "",
        };
      });

      return {
        products,
        total: result.data.total_count || products.length,
        page,
        per_page: perPage,
      };
    }

    throw new Error(result.message || "Errore nella ricerca prodotti");
  }

  async getProduct(productId: string): Promise<MobilesentrixProduct> {
    // Magento 2 REST API - get product by SKU
    const result = await this.request<any>(`/products/${encodeURIComponent(productId)}`);
    if (result.success && result.data) {
      const p = result.data;
      const getAttr = (code: string) => {
        const attr = p.custom_attributes?.find((a: any) => a.attribute_code === code);
        return attr?.value || "";
      };
      
      return {
        id: String(p.id),
        sku: p.sku || "",
        name: p.name || "",
        brand: getAttr("manufacturer") || getAttr("brand") || "",
        model: getAttr("model") || "",
        category: "",
        price: p.price || 0,
        stock: p.extension_attributes?.stock_item?.qty || 0,
        image_url: p.media_gallery_entries?.[0]?.file 
          ? `https://www.mobilesentrix.eu/media/catalog/product${p.media_gallery_entries[0].file}` 
          : "",
        description: getAttr("description") || getAttr("short_description") || "",
      };
    }
    throw new Error(result.message || "Prodotto non trovato");
  }

  async createOrder(items: MobilesentrixCartItem[], shippingAddress: MobilesentrixAddress, shippingMethod?: string): Promise<MobilesentrixOrderResponse> {
    // First create a cart
    const cartResult = await this.request<string>("/carts/mine", "POST");
    if (!cartResult.success) {
      throw new Error("Errore nella creazione del carrello");
    }
    const cartId = cartResult.data;

    // Add items to cart
    for (const item of items) {
      await this.request<any>(`/carts/mine/items`, "POST", {
        cartItem: {
          sku: item.sku,
          qty: item.quantity,
          quote_id: cartId
        }
      });
    }

    // Set shipping address and create order
    const orderResult = await this.request<any>("/carts/mine/order", "PUT", {
      paymentMethod: { method: "checkmo" }
    });

    if (orderResult.success && orderResult.data) {
      return {
        order_id: String(orderResult.data),
        order_number: String(orderResult.data),
        status: "pending",
        total: items.reduce((sum, i) => sum + (i.price * i.quantity), 0),
        created_at: new Date().toISOString()
      };
    }
    throw new Error(orderResult.message || "Errore nella creazione ordine");
  }

  async getOrder(orderId: string): Promise<MobilesentrixOrderResponse> {
    const result = await this.request<any>(`/orders/${orderId}`);
    if (result.success && result.data) {
      return {
        order_id: String(result.data.entity_id),
        order_number: result.data.increment_id,
        status: result.data.status,
        total: result.data.grand_total,
        created_at: result.data.created_at
      };
    }
    throw new Error(result.message || "Ordine non trovato");
  }

  async listOrders(params?: { page?: number; per_page?: number }): Promise<{ orders: MobilesentrixOrderResponse[]; total: number }> {
    const queryParams: Record<string, string> = {};
    const page = params?.page || 1;
    const perPage = params?.per_page || 20;
    queryParams["searchCriteria[currentPage]"] = String(page);
    queryParams["searchCriteria[pageSize]"] = String(perPage);

    const result = await this.request<any>("/orders", "GET", undefined, queryParams);
    if (result.success && result.data) {
      const orders = (result.data.items || []).map((o: any) => ({
        order_id: String(o.entity_id),
        order_number: o.increment_id,
        status: o.status,
        total: o.grand_total,
        created_at: o.created_at
      }));
      return {
        orders,
        total: result.data.total_count || orders.length,
      };
    }
    throw new Error(result.message || "Errore nel recupero ordini");
  }

  async getBrands(): Promise<string[]> {
    // Magento 2 - get manufacturer attribute options
    const result = await this.request<any>("/products/attributes/manufacturer");
    if (result.success && result.data?.options) {
      return result.data.options.filter((o: any) => o.value).map((o: any) => o.label);
    }
    return [];
  }

  async getAccountInfo(): Promise<{ name: string; email: string; balance?: number }> {
    const result = await this.request<any>("/customers/me");
    if (result.success && result.data) {
      return {
        name: `${result.data.firstname || ""} ${result.data.lastname || ""}`.trim(),
        email: result.data.email || "",
        balance: result.data.extension_attributes?.reward_balance || undefined
      };
    }
    throw new Error(result.message || "Errore nel recupero informazioni account");
  }
}

let serviceCache: Map<string, { service: MobilesentrixService; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000;

export function getMobilesentrixService(credential: MobilesentrixCredential): MobilesentrixService {
  const cacheKey = credential.id;
  const cached = serviceCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.service;
  }
  
  const service = new MobilesentrixService(credential);
  serviceCache.set(cacheKey, { service, timestamp: Date.now() });
  return service;
}
