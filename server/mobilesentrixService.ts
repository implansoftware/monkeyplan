import { MobilesentrixCredential } from "@shared/schema";
import crypto from "crypto";

// MobileSentrix environments
// Production: https://www.mobilesentrix.eu
// Staging: https://preprod.mobilesentrix.eu
function getMobilesentrixBaseUrl(environment: string): string {
  if (environment === "staging") {
    return "https://preprod.mobilesentrix.eu";
  }
  return "https://www.mobilesentrix.eu";
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

// Metodi di spedizione disponibili per regione
export const SHIPPING_METHODS = {
  // USA methods
  US: [
    { code: "flatrate3_flatrate3", name: "FedEx Ground", region: "US" },
    { code: "flatrate4_flatrate4", name: "FedEx 2Day", region: "US" },
    { code: "flatrate5_flatrate5", name: "FedEx Standard Overnight", region: "US" },
    { code: "flatrate6_flatrate6", name: "FedEx Priority Overnight", region: "US" },
    { code: "flatrate8_flatrate8", name: "FedEx Saturday Delivery", region: "US" },
    { code: "flatrate003_flatrate003", name: "UPS Ground", region: "US" },
    { code: "flatrate001_flatrate001", name: "UPS Priority Overnight", region: "US" },
    { code: "flatrate002_flatrate002", name: "UPS 2nd Day Air", region: "US" },
    { code: "flatrate013_flatrate013", name: "UPS Standard Overnight", region: "US" },
    { code: "flatrate001s_flatrate001s", name: "UPS Saturday Delivery", region: "US" },
    { code: "flatrate14_flatrate14", name: "USPS First Class", region: "US" },
  ],
  // EU methods - same as US per MobileSentrix API documentation
  EU: [
    { code: "flatrate6_flatrate6", name: "FedEx Priority Overnight", region: "EU" },
    { code: "flatrate5_flatrate5", name: "FedEx Standard Overnight", region: "EU" },
    { code: "flatrate4_flatrate4", name: "FedEx 2Day", region: "EU" },
    { code: "flatrate3_flatrate3", name: "FedEx Ground", region: "EU" },
    { code: "flatrate8_flatrate8", name: "FedEx Saturday Delivery", region: "EU" },
  ],
  // International
  INTL: [
    { code: "flatrate6_flatrate6", name: "FedEx International Priority", region: "INTL" },
    { code: "flatrate5_flatrate5", name: "FedEx International Economy", region: "INTL" },
  ]
};

// Default shipping method based on region
export function getDefaultShippingMethod(countryId: string): string {
  const euCountries = ["IT", "DE", "FR", "ES", "NL", "BE", "AT", "PT", "GR", "PL", "CZ", "SK", "HU", "RO", "BG", "HR", "SI", "LT", "LV", "EE", "IE", "FI", "SE", "DK"];
  if (euCountries.includes(countryId)) {
    return "flatrate6_flatrate6"; // FedEx Priority Overnight for EU
  }
  if (countryId === "US") {
    return "flatrate3_flatrate3"; // FedEx Ground for US
  }
  return "flatrate6_flatrate6"; // FedEx International Priority
}

export function getShippingMethodsForCountry(countryId: string): { code: string; name: string; region: string }[] {
  const euCountries = ["IT", "DE", "FR", "ES", "NL", "BE", "AT", "PT", "GR", "PL", "CZ", "SK", "HU", "RO", "BG", "HR", "SI", "LT", "LV", "EE", "IE", "FI", "SE", "DK"];
  if (euCountries.includes(countryId)) {
    return SHIPPING_METHODS.EU;
  }
  if (countryId === "US") {
    return SHIPPING_METHODS.US;
  }
  return SHIPPING_METHODS.INTL;
}

export class MobilesentrixService {
  private credential: MobilesentrixCredential;
  private baseUrl: string;

  constructor(credential: MobilesentrixCredential) {
    this.credential = credential;
    const environment = (credential as any).environment || "production";
    this.baseUrl = getMobilesentrixBaseUrl(environment);
  }

  private generateOAuthSignature(
    method: string,
    url: string,
    params: Record<string, string>,
    consumerSecret: string,
    tokenSecret: string = ""
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

    // HMAC-SHA1 with consumer secret & token secret
    const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

    const hmac = crypto.createHmac("sha1", signingKey);
    hmac.update(signatureBaseString);
    return hmac.digest("base64");
  }

  private generateOAuthHeader(
    method: string, 
    baseUrl: string, 
    queryParams?: Record<string, string>
  ): string {
    const credential = this.credential as any;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString("hex");

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: credential.consumerKey,
      oauth_nonce: nonce,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: timestamp,
      oauth_version: "1.0"
    };

    // Add access token if available
    if (credential.accessToken) {
      oauthParams.oauth_token = credential.accessToken;
    }

    const allParams: Record<string, string> = { ...oauthParams };
    
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        allParams[key] = value;
      });
    }

    const signature = this.generateOAuthSignature(
      method,
      baseUrl,
      allParams,
      credential.consumerSecret,
      credential.accessTokenSecret || ""
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
    const credential = this.credential as any;
    
    // Check for access token
    if (!credential.accessToken) {
      return {
        success: false,
        message: "Access Token non configurato. Completa prima l'autenticazione OAuth cliccando 'Autorizza con MobileSentrix'.",
      };
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const authHeader = this.generateOAuthHeader(
      method, 
      url.origin + url.pathname, 
      queryParams
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
      console.log(`MobileSentrix Request: ${method} ${url.toString()}`);
      const response = await fetch(url.toString(), options);
      
      const contentType = response.headers.get("content-type") || "";
      const responseText = await response.text();
      
      // Check if response is HTML (indicates auth failure or invalid endpoint)
      if (contentType.includes("text/html") || responseText.trim().startsWith("<!DOCTYPE") || responseText.trim().startsWith("<html")) {
        console.log(`MobileSentrix returned HTML instead of JSON. Status: ${response.status}`);
        return {
          success: false,
          message: `L'API MobileSentrix ha restituito HTML invece di JSON. Verifica le credenziali OAuth o l'Access Token. (Status: ${response.status})`,
        };
      }
      
      if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}`;
        try {
          const errorJson = JSON.parse(responseText);
          if (errorJson.messages?.error?.[0]?.message) {
            errorMessage = errorJson.messages.error[0].message;
          } else {
            errorMessage = errorJson.message || errorJson.error || errorMessage;
          }
        } catch {
          errorMessage = responseText.substring(0, 200) || errorMessage;
        }
        return {
          success: false,
          message: errorMessage,
        };
      }

      try {
        const json = JSON.parse(responseText);
        return {
          success: true,
          data: json,
        };
      } catch {
        return {
          success: false,
          message: "Risposta API non valida (non JSON)",
        };
      }
    } catch (error: any) {
      console.error("MobileSentrix API Error:", error);
      return {
        success: false,
        message: error.message || "Errore di connessione",
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const credential = this.credential as any;
    
    if (!credential.accessToken) {
      return { 
        success: false, 
        message: "Access Token non configurato. Clicca 'Autorizza con MobileSentrix' per completare l'autenticazione." 
      };
    }
    
    try {
      // Test with products endpoint (limited to 1 product)
      const result = await this.request<any>("/api/rest/products", "GET", undefined, {
        "limit": "1",
        "page": "1"
      });
      
      if (result.success) {
        return { 
          success: true, 
          message: "Connessione riuscita - API MobileSentrix attiva e catalogo accessibile." 
        };
      }
      
      return { 
        success: false, 
        message: result.message || "Errore di connessione all'API MobileSentrix." 
      };
    } catch (error: any) {
      return { success: false, message: error.message || "Errore di connessione" };
    }
  }

  async getCategories(): Promise<MobilesentrixCategory[]> {
    const result = await this.request<any>("/api/rest/categories");
    if (result.success && result.data) {
      // MobileSentrix returns categories as an object with category IDs as keys
      const categories: MobilesentrixCategory[] = [];
      const extractCategories = (data: any): void => {
        if (Array.isArray(data)) {
          data.forEach(cat => {
            categories.push({
              id: String(cat.entity_id || cat.id),
              name: cat.name,
              parent_id: cat.parent_id ? String(cat.parent_id) : null
            });
          });
        } else if (typeof data === 'object') {
          Object.values(data).forEach((cat: any) => {
            if (cat.entity_id || cat.id) {
              categories.push({
                id: String(cat.entity_id || cat.id),
                name: cat.name,
                parent_id: cat.parent_id ? String(cat.parent_id) : null
              });
            }
          });
        }
      };
      extractCategories(result.data);
      return categories;
    }
    throw new Error(result.message || "Errore nel recupero categorie");
  }

  async getCustomerAddresses(): Promise<{ id: string; type: string; firstname: string; lastname: string; company?: string; street: string; city: string; region: string; postcode: string; country_id: string; telephone: string; }[]> {
    // MobileSentrix doesn't have a /customer endpoint, so we extract addresses from orders
    const result = await this.request<any>("/api/rest/orders", "GET", undefined, { limit: "10", page: "1" });
    
    if (result.success && result.data) {
      const addressMap = new Map<string, any>();
      
      // Extract unique addresses from orders
      Object.values(result.data).forEach((order: any) => {
        if (order.addresses && Array.isArray(order.addresses)) {
          order.addresses.forEach((addr: any) => {
            // Create unique key based on address fields
            const key = `${addr.firstname}-${addr.lastname}-${addr.street}-${addr.postcode}`;
            if (!addressMap.has(key)) {
              addressMap.set(key, {
                id: addr.entity_id || addr.address_id || key,
                type: addr.address_type,
                firstname: addr.firstname || "",
                lastname: addr.lastname || "",
                company: addr.company || "",
                street: addr.street || "",
                city: addr.city || "",
                region: addr.region || "",
                postcode: addr.postcode || "",
                country_id: addr.country_id || "",
                telephone: addr.telephone || ""
              });
            }
          });
        }
      });
      
      return Array.from(addressMap.values());
    }
    
    return [];
  }

  async searchProducts(params: {
    query?: string;
    category_id?: string;
    brand?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ products: MobilesentrixProduct[]; total: number; page: number; per_page: number }> {
    const queryParams: Record<string, string> = {};
    
    const page = params.page || 1;
    const perPage = params.per_page || 20;
    queryParams["page"] = String(page);
    queryParams["limit"] = String(perPage);
    queryParams["pageinfo"] = "1";
    
    if (params.category_id) {
      queryParams["category_id"] = params.category_id;
    }
    
    if (params.query) {
      // Use SKU filter for search
      queryParams["filter[1][attribute]"] = "name";
      queryParams["filter[1][like]"] = `%${params.query}%`;
    }

    const result = await this.request<any>("/api/rest/products", "GET", undefined, queryParams);

    if (result.success && result.data) {
      const products: MobilesentrixProduct[] = [];
      
      // MobileSentrix returns products as object with product IDs as keys
      Object.entries(result.data).forEach(([key, p]: [string, any]) => {
        // Skip pagination info
        if (key === 'page_info' || key === 'total_count') return;
        
        const stock = parseInt(p.in_stock_qty) || 0;
        
        // Skip products with no stock (hide out-of-stock items)
        if (stock <= 0) return;
        
        products.push({
          id: String(p.entity_id || key),
          sku: p.sku || "",
          name: p.name || "",
          brand: p.manufacturer_text || "",
          model: p.model_text || "",
          category: "",
          price: parseFloat(p.customer_price || p.price) || 0,
          stock,
          image_url: p.image_url || p.default_image || "",
          description: p.short_description || p.description || "",
        });
      });

      // Total count reflects only in-stock products
      const totalCount = products.length;

      return {
        products,
        total: totalCount,
        page,
        per_page: perPage,
      };
    }

    throw new Error(result.message || "Errore nella ricerca prodotti");
  }

  async getProduct(productId: string): Promise<MobilesentrixProduct> {
    const result = await this.request<any>(`/api/rest/products/${encodeURIComponent(productId)}`);
    if (result.success && result.data) {
      const p = result.data;
      
      return {
        id: String(p.entity_id || productId),
        sku: p.sku || "",
        name: p.name || "",
        brand: p.manufacturer_text || "",
        model: p.model_text || "",
        category: "",
        price: parseFloat(p.customer_price || p.price) || 0,
        stock: parseInt(p.in_stock_qty) || 0,
        image_url: p.image_url || p.default_image || "",
        description: p.description || p.short_description || "",
      };
    }
    throw new Error(result.message || "Prodotto non trovato");
  }

  async createOrder(items: MobilesentrixCartItem[], shippingAddress: MobilesentrixAddress, shippingMethod?: string): Promise<MobilesentrixOrderResponse> {
    // Step 1: Add items to cart (MobileSentrix requires "customrest": 1 and "products" array)
    console.log("MobileSentrix createOrder - Adding items to cart:", JSON.stringify(items));
    
    const cartResult = await this.request<any>("/api/rest/cart", "POST", {
      customrest: 1,
      products: items.map(item => ({
        sku: item.sku,
        qty: item.quantity
      }))
    });
    
    console.log("MobileSentrix cart response:", JSON.stringify(cartResult));
    
    if (!cartResult.success) {
      throw new Error(cartResult.message || "Errore nell'aggiunta prodotti al carrello MobileSentrix");
    }

    // Check if any items failed to be added (e.g., out of stock)
    if (cartResult.data?.items && Array.isArray(cartResult.data.items)) {
      const failedItems = cartResult.data.items.filter((item: any) => item.status === 0);
      if (failedItems.length > 0) {
        const errorMessages = failedItems.map((item: any) => item.message || `Prodotto ${item.sku} non disponibile`);
        throw new Error("Alcuni prodotti non sono disponibili: " + errorMessages.join("; "));
      }
    }

    // Get quote_id from cart response
    const quoteId = cartResult.data?.quote_id;
    if (!quoteId) {
      console.log("MobileSentrix cart data without quote_id:", JSON.stringify(cartResult.data));
      throw new Error("Carrello creato ma quote_id non restituito. Risposta: " + JSON.stringify(cartResult.data));
    }

    // Step 2: Get customer_id from previous orders, then fetch addresses
    console.log("MobileSentrix - Fetching orders to get customer_id...");
    let addressId: string | null = null;
    let customerId: string | null = null;
    
    try {
      const ordersResult = await this.request<any>("/api/rest/orders", "GET", undefined, { limit: "1", page: "1" });
      console.log("MobileSentrix orders response:", JSON.stringify(ordersResult).substring(0, 500));
      
      if (ordersResult.success && ordersResult.data) {
        const orders = Object.values(ordersResult.data);
        if (orders.length > 0) {
          const firstOrder = orders[0] as any;
          customerId = firstOrder.customer_id ? String(firstOrder.customer_id) : null;
        }
      }
    } catch (error) {
      console.log("MobileSentrix - Could not fetch orders:", error);
    }
    
    // Try to get address from /customers/:customer_id/addresses
    if (customerId) {
      console.log("MobileSentrix - Fetching addresses for customer:", customerId);
      try {
        const addressesResult = await this.request<any>(`/api/rest/customers/${customerId}/addresses`);
        console.log("MobileSentrix addresses response:", JSON.stringify(addressesResult).substring(0, 500));
        
        if (addressesResult.success && addressesResult.data) {
          // Get first address entity_id
          const addresses = Object.values(addressesResult.data);
          if (addresses.length > 0) {
            const firstAddr = addresses[0] as any;
            addressId = firstAddr.entity_id || firstAddr.id || null;
            console.log("MobileSentrix - Found address ID:", addressId);
          }
        }
      } catch (error) {
        console.log("MobileSentrix - Could not fetch addresses:", error);
      }
    }
    
    if (!addressId) {
      throw new Error("Nessun indirizzo di spedizione trovato nel tuo account MobileSentrix. Verifica di avere un indirizzo configurato sul sito MobileSentrix.");
    }

    // Step 3: Create order using quote_id
    // Default shipping method: FedEx Ground = flatrate3_flatrate3
    const selectedShipping = shippingMethod || "flatrate3_flatrate3";
    
    // Build order request with required address IDs
    const orderRequest: any = {
      customrest: "1",
      quote_id: String(quoteId),
      billing_id: String(addressId),
      shipping_id: String(addressId),
      shipping_method: selectedShipping,
      payment_method: "mygateway"
    };
    
    console.log("MobileSentrix - Creating order with request:", JSON.stringify(orderRequest));
    
    const orderResult = await this.request<any>("/api/rest/createorder", "POST", orderRequest);
    console.log("MobileSentrix createorder response:", JSON.stringify(orderResult));

    if (!orderResult.success) {
      throw new Error(orderResult.message || "Errore nella creazione dell'ordine: " + JSON.stringify(orderResult));
    }

    if (orderResult.data?.order_id || orderResult.data?.increment_id) {
      return {
        order_id: String(orderResult.data.order_id || orderResult.data.increment_id),
        order_number: orderResult.data.increment_id || String(orderResult.data.order_id),
        status: "pending",
        total: items.reduce((sum, i) => sum + (i.price * i.quantity), 0),
        created_at: new Date().toISOString()
      };
    }

    throw new Error("Ordine creato ma risposta non valida");
  }

  // Get available shipping methods from API
  async getAvailableShippingMethods(quoteId?: string): Promise<{ code: string; title: string; }[]> {
    try {
      // Try to get shipping methods from the API
      const endpoint = quoteId 
        ? `/api/rest/cart/${quoteId}/shipping-methods`
        : "/api/rest/shipping-methods";
      
      const result = await this.request<any>(endpoint);
      console.log("MobileSentrix shipping methods response:", JSON.stringify(result));
      
      if (result.success && result.data) {
        const methods: { code: string; title: string; }[] = [];
        
        // Handle different response formats
        if (Array.isArray(result.data)) {
          result.data.forEach((m: any) => {
            methods.push({
              code: m.code || m.method_code || m.carrier_code + "_" + m.method_code,
              title: m.title || m.method_title || m.carrier_title
            });
          });
        } else if (typeof result.data === 'object') {
          Object.entries(result.data).forEach(([key, val]: [string, any]) => {
            methods.push({
              code: val.code || key,
              title: val.title || val.method_title || key
            });
          });
        }
        
        return methods;
      }
      
      return [];
    } catch (error) {
      console.log("MobileSentrix - Could not fetch shipping methods:", error);
      return [];
    }
  }

  async getOrder(orderId: string): Promise<MobilesentrixOrderResponse> {
    const result = await this.request<any>(`/api/rest/orders/${orderId}`);
    if (result.success && result.data) {
      return {
        order_id: String(result.data.entity_id || orderId),
        order_number: result.data.increment_id || String(orderId),
        status: result.data.status || "unknown",
        total: parseFloat(result.data.grand_total) || 0,
        created_at: result.data.created_at || new Date().toISOString()
      };
    }
    throw new Error(result.message || "Ordine non trovato");
  }

  async listOrders(params?: { page?: number; per_page?: number }): Promise<{ orders: MobilesentrixOrderResponse[]; total: number }> {
    const queryParams: Record<string, string> = {};
    const page = params?.page || 1;
    const perPage = params?.per_page || 20;
    queryParams["page"] = String(page);
    queryParams["limit"] = String(perPage);

    const result = await this.request<any>("/api/rest/orders", "GET", undefined, queryParams);
    if (result.success && result.data) {
      const orders: MobilesentrixOrderResponse[] = [];
      
      Object.values(result.data).forEach((o: any) => {
        if (o.entity_id) {
          orders.push({
            order_id: String(o.entity_id),
            order_number: o.increment_id || String(o.entity_id),
            status: o.status || "unknown",
            total: parseFloat(o.grand_total) || 0,
            created_at: o.created_at || ""
          });
        }
      });
      
      return {
        orders,
        total: orders.length,
      };
    }
    throw new Error(result.message || "Errore nel recupero ordini");
  }

  async getBrands(): Promise<string[]> {
    // Get products from multiple pages to extract more manufacturers
    const brands = new Set<string>();
    const pagesToFetch = 10; // Fetch 10 pages of 100 products each = 1000 products
    
    const fetchPromises = [];
    for (let page = 1; page <= pagesToFetch; page++) {
      fetchPromises.push(
        this.request<any>("/api/rest/products", "GET", undefined, {
          "limit": "100",
          "page": String(page)
        }).catch(err => {
          console.error(`Error fetching brands page ${page}:`, err);
          return null;
        })
      );
    }
    
    const results = await Promise.all(fetchPromises);
    
    for (const result of results) {
      if (result?.success && result?.data) {
        Object.values(result.data).forEach((p: any) => {
          if (p.manufacturer_text) {
            brands.add(p.manufacturer_text);
          }
        });
      }
    }
    
    return Array.from(brands).sort();
  }

  async getAccountInfo(): Promise<{ name: string; email: string; balance?: number }> {
    const result = await this.request<any>("/api/rest/customer");
    if (result.success && result.data) {
      return {
        name: `${result.data.firstname || ""} ${result.data.lastname || ""}`.trim(),
        email: result.data.email || "",
        balance: result.data.store_credit_balance || undefined
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
