import { SifarCredential } from "@shared/schema";

const SIFAR_BASE_URLS = {
  collaudo: "https://collaudo.sifar.it/apiv2",
  produzione: "https://www.sifar.it/apiv2",
};

interface SifarApiResponse<T> {
  responseCode: number;
  responseMessage?: string;
  data?: T;
}

interface SifarBrand {
  codiceMarca: string;
  descMarca: string;
}

interface SifarModel {
  codiceModello: string;
  descModello: string;
  codiceMarca: string;
}

interface SifarCategory {
  codiceCategoria: string;
  descCategoria: string;
  sito?: string;
}

interface SifarGroup {
  codiceGruppo: string;
  descGruppo: string;
}

interface SifarArticle {
  codiceArticolo: string;
  descArticolo: string;
  prezzo: number;
  prezzoIvato: number;
  aliquota: number;
  disponibile: boolean;
  giacenza?: number;
  ean?: string;
  contattaPerOrdinare?: boolean;
  urlImmagine?: string;
  qualita?: string;
  mesiGaranzia?: number;
}

interface SifarArticleDetail extends SifarArticle {
  marca?: string;
  modello?: string;
  categoria?: string;
  gruppo?: string;
}

interface SifarCartItem {
  codiceArticolo: string;
  descArticolo: string;
  quantita: number;
  prezzo: number;
  prezzoIvato: number;
  totale: number;
  totaleIvato: number;
  disponibile: boolean;
}

interface SifarCartDetail {
  articoli: SifarCartItem[];
  totale: number;
  totaleIvato: number;
  inviabile: boolean;
}

interface SifarCourier {
  codiceCorriere: string;
  descCorriere: string;
  disponibile: boolean;
}

interface SifarOrderResponse {
  numeroOrdine: string;
  idOrdine: string;
  dataOrdine: string;
  totale: number;
}

export class SifarService {
  private credential: SifarCredential;
  private baseUrl: string;

  constructor(credential: SifarCredential) {
    this.credential = credential;
    this.baseUrl = SIFAR_BASE_URLS[credential.environment];
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "DELETE" = "GET",
    body?: Record<string, any>,
    storeCode?: string
  ): Promise<SifarApiResponse<T>> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    
    if (storeCode) {
      url.searchParams.append("puntoVendita", storeCode);
    }

    const headers: Record<string, string> = {
      "Token": this.credential.clientKey,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "DELETE")) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url.toString(), options);
      
      if (!response.ok) {
        const errorText = await response.text();
        return {
          responseCode: response.status,
          responseMessage: errorText || `HTTP Error ${response.status}`,
        };
      }

      const json = await response.json();
      return {
        responseCode: json.responseCode ?? 0,
        responseMessage: json.responseMessage,
        data: json as T,
      };
    } catch (error: any) {
      console.error("SIFAR API Error:", error);
      return {
        responseCode: -1,
        responseMessage: error.message || "Errore di connessione",
      };
    }
  }

  async testConnection(storeCode: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.request<SifarBrand[]>("Marchi", "GET", undefined, storeCode);
      if (result.responseCode === 0) {
        return { success: true, message: "Connessione riuscita" };
      }
      return { success: false, message: result.responseMessage || "Errore sconosciuto" };
    } catch (error: any) {
      return { success: false, message: error.message || "Errore di connessione" };
    }
  }

  async getCategories(storeCode: string): Promise<SifarCategory[]> {
    const result = await this.request<{ categorie: SifarCategory[] }>("Categorie", "GET", undefined, storeCode);
    if (result.responseCode === 0 && result.data) {
      return result.data.categorie || [];
    }
    throw new Error(result.responseMessage || "Errore nel recupero categorie");
  }

  async getGroups(storeCode: string): Promise<SifarGroup[]> {
    const result = await this.request<{ gruppi: SifarGroup[] }>("Gruppi", "GET", undefined, storeCode);
    if (result.responseCode === 0 && result.data) {
      return result.data.gruppi || [];
    }
    throw new Error(result.responseMessage || "Errore nel recupero gruppi");
  }

  async getBrands(storeCode: string): Promise<SifarBrand[]> {
    const result = await this.request<{ marchi: SifarBrand[] }>("Marchi", "GET", undefined, storeCode);
    if (result.responseCode === 0 && result.data) {
      return result.data.marchi || [];
    }
    throw new Error(result.responseMessage || "Errore nel recupero marchi");
  }

  async getModelsByBrand(storeCode: string, brandCode: string): Promise<SifarModel[]> {
    const result = await this.request<{ modelli: SifarModel[] }>(
      `ModelliMarchio?codiceMarca=${brandCode}`,
      "GET",
      undefined,
      storeCode
    );
    if (result.responseCode === 0 && result.data) {
      return result.data.modelli || [];
    }
    throw new Error(result.responseMessage || "Errore nel recupero modelli");
  }

  async getCategoriesGroupsByModel(storeCode: string, modelCode: string): Promise<{ categoria: string; gruppo: string }[]> {
    const result = await this.request<{ categorieGruppi: { categoria: string; gruppo: string }[] }>(
      `CategorieGruppiModello?codiceModello=${modelCode}`,
      "GET",
      undefined,
      storeCode
    );
    if (result.responseCode === 0 && result.data) {
      return result.data.categorieGruppi || [];
    }
    throw new Error(result.responseMessage || "Errore nel recupero categorie/gruppi");
  }

  async getArticlesByModel(
    storeCode: string,
    modelCode: string,
    categoryCode?: string,
    groupCode?: string
  ): Promise<SifarArticle[]> {
    let endpoint = `ArticoliModello?codiceModello=${modelCode}`;
    if (categoryCode) endpoint += `&codiceCategoria=${categoryCode}`;
    if (groupCode) endpoint += `&codiceGruppo=${groupCode}`;
    
    const result = await this.request<{ articoli: SifarArticle[] }>(endpoint, "GET", undefined, storeCode);
    if (result.responseCode === 0 && result.data) {
      return result.data.articoli || [];
    }
    throw new Error(result.responseMessage || "Errore nel recupero articoli");
  }

  async getArticleDetail(storeCode: string, articleCode: string): Promise<SifarArticleDetail> {
    const result = await this.request<{ articolo: SifarArticleDetail }>(
      `DettaglioArticolo?codiceArticolo=${articleCode}`,
      "GET",
      undefined,
      storeCode
    );
    if (result.responseCode === 0 && result.data?.articolo) {
      return result.data.articolo;
    }
    throw new Error(result.responseMessage || "Articolo non trovato");
  }

  async addToCart(storeCode: string, articleCode: string, quantity: number): Promise<boolean> {
    const result = await this.request(
      "AggiungiAlCarrello",
      "POST",
      { codiceArticolo: articleCode, quantita: quantity },
      storeCode
    );
    if (result.responseCode !== 0) {
      throw new Error(result.responseMessage || "Errore nell'aggiunta al carrello");
    }
    return true;
  }

  async updateCartItem(storeCode: string, articleCode: string, quantity: number): Promise<boolean> {
    const result = await this.request(
      "AggiornaCarrello",
      "POST",
      { codiceArticolo: articleCode, quantita: quantity },
      storeCode
    );
    if (result.responseCode !== 0) {
      throw new Error(result.responseMessage || "Errore nell'aggiornamento carrello");
    }
    return true;
  }

  async removeFromCart(storeCode: string, articleCode: string): Promise<boolean> {
    const result = await this.request(
      "RimuoviArticolo",
      "DELETE",
      { codiceArticolo: articleCode },
      storeCode
    );
    if (result.responseCode !== 0) {
      throw new Error(result.responseMessage || "Errore nella rimozione dal carrello");
    }
    return true;
  }

  async getCartDetail(storeCode: string): Promise<SifarCartDetail> {
    const result = await this.request<SifarCartDetail>("DettaglioCarrello", "GET", undefined, storeCode);
    if (result.responseCode === 0 && result.data) {
      return result.data;
    }
    throw new Error(result.responseMessage || "Errore nel recupero carrello");
  }

  async clearCart(storeCode: string): Promise<boolean> {
    const result = await this.request("EliminaCarrello", "DELETE", undefined, storeCode);
    if (result.responseCode !== 0) {
      throw new Error(result.responseMessage || "Errore nello svuotamento carrello");
    }
    return true;
  }

  async getCouriers(storeCode: string): Promise<SifarCourier[]> {
    const result = await this.request<{ corrieri: SifarCourier[] }>("Corrieri", "GET", undefined, storeCode);
    if (result.responseCode === 0 && result.data) {
      return result.data.corrieri || [];
    }
    throw new Error(result.responseMessage || "Errore nel recupero corrieri");
  }

  async submitOrder(storeCode: string, courierId: string): Promise<SifarOrderResponse> {
    const result = await this.request<SifarOrderResponse>(
      "InviaOrdine",
      "POST",
      { codiceCorriere: courierId },
      storeCode
    );
    if (result.responseCode === 0 && result.data) {
      return result.data;
    }
    throw new Error(result.responseMessage || "Errore nell'invio ordine");
  }

  async getOrders(storeCode: string): Promise<any[]> {
    const result = await this.request<{ ordini: any[] }>("ListaOrdini", "GET", undefined, storeCode);
    if (result.responseCode === 0 && result.data) {
      return result.data.ordini || [];
    }
    throw new Error(result.responseMessage || "Errore nel recupero ordini");
  }

  async getOrderDetail(storeCode: string, orderId: string): Promise<any> {
    const result = await this.request<{ ordine: any }>(
      `DettaglioOrdine?idOrdine=${orderId}`,
      "GET",
      undefined,
      storeCode
    );
    if (result.responseCode === 0 && result.data?.ordine) {
      return result.data.ordine;
    }
    throw new Error(result.responseMessage || "Ordine non trovato");
  }
}

export function createSifarService(credential: SifarCredential): SifarService {
  return new SifarService(credential);
}
