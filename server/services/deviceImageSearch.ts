
const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

interface WikiPage {
  title: string;
  thumbnail?: { source: string; width: number; height: number };
}

interface CommonsImageInfo {
  thumburl?: string;
  url?: string;
}

const GENERIC_IMAGE_PATTERNS = [
  "android_phone",
  "generic_",
  "placeholder",
  "no_image",
  "missing",
  "flag_of",
  "coat_of_arms",
  "emblem_of",
  "seal_of",
  "blank",
  "map_of",
  "logo_",
  "_logo",
];

const COMPANY_SUFFIXES = [
  " inc.", " inc,", " corp.", " ltd.", " co.", " group", " holdings",
  "(company)", "(brand)", "(manufacturer)", "(corporation)", "silicon",
  " plc", " sa", " ag", " gmbh",
];

function isValidImageUrl(src: string): boolean {
  const lower = src.toLowerCase();
  return !GENERIC_IMAGE_PATTERNS.some((p) => lower.includes(p));
}

function cleanModelName(model: string): string {
  return model
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s*\d+["""′]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getModelKey(model: string): string {
  const cleaned = cleanModelName(model);
  const first = cleaned.toLowerCase().split(" ")[0];
  return first || model.toLowerCase().split(" ")[0];
}

function isTitleRelevant(title: string, brand: string, model: string): boolean {
  const titleLower = title.toLowerCase();
  const brandLower = brand.toLowerCase();
  const modelKey = getModelKey(model);

  if (titleLower === brandLower) return false;
  if (titleLower.startsWith("list of")) return false;
  if (titleLower.startsWith("history of")) return false;
  if (COMPANY_SUFFIXES.some(s => titleLower.includes(s))) return false;
  if (!titleLower.includes(modelKey) && modelKey.length > 1) return false;
  return true;
}

function isCommonsFileRelevant(filename: string, brand: string, model: string): boolean {
  const lower = filename.toLowerCase();
  if (GENERIC_IMAGE_PATTERNS.some((p) => lower.includes(p))) return false;
  const brandLower = brand.toLowerCase();
  const modelKey = getModelKey(model);
  return lower.includes(brandLower) || lower.includes(modelKey);
}

const RATE_LIMIT_PAUSE_MS = 5000;

async function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithTimeout(url: string, timeoutMs = 8000, retries = 2): Promise<Response | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "MonkeyPlan/1.0 (repair-management; contact@monkeyplan.it)" },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("retry-after") || "0", 10);
        const pause = retryAfter > 0 ? retryAfter * 1000 : RATE_LIMIT_PAUSE_MS;
        console.warn(`[DeviceImageSearch] Rate limited (429). Waiting ${pause}ms before retry...`);
        await sleep(pause);
        continue;
      }
      return res;
    } catch {
      if (attempt < retries) await sleep(1000 * (attempt + 1));
    }
  }
  return null;
}

async function fetchWikipediaImage(
  query: string,
  brand: string,
  model: string
): Promise<string | null> {
  try {
    const searchRes = await fetchWithTimeout(
      `${WIKIPEDIA_API}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=5`
    );
    if (!searchRes?.ok) return null;
    const searchData = await searchRes.json();
    const results: { title: string }[] = searchData?.query?.search || [];
    if (results.length === 0) return null;

    for (const result of results) {
      if (!isTitleRelevant(result.title, brand, model)) continue;

      const pageRes = await fetchWithTimeout(
        `${WIKIPEDIA_API}?action=query&titles=${encodeURIComponent(result.title)}&prop=pageimages&format=json&pithumbsize=500&redirects=1`
      );
      if (!pageRes?.ok) continue;
      const pageData = await pageRes.json();
      const pages = Object.values(pageData?.query?.pages || {}) as WikiPage[];
      const page = pages[0];
      if (page?.thumbnail?.source && isValidImageUrl(page.thumbnail.source)) {
        return page.thumbnail.source;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchWikipediaImageByTitle(
  title: string,
  model: string
): Promise<string | null> {
  try {
    const pageRes = await fetchWithTimeout(
      `${WIKIPEDIA_API}?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=500&redirects=1`
    );
    if (!pageRes?.ok) return null;
    const pageData = await pageRes.json();
    const pages = Object.values(pageData?.query?.pages || {}) as (WikiPage & { missing?: string })[];
    const page = pages[0];
    if (!page || "missing" in page) return null;
    if (page?.thumbnail?.source && isValidImageUrl(page.thumbnail.source)) {
      return page.thumbnail.source;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchWikimediaCommonsImage(
  query: string,
  brand: string,
  model: string
): Promise<string | null> {
  try {
    const searchRes = await fetchWithTimeout(
      `${COMMONS_API}?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&format=json&srlimit=8`
    );
    if (!searchRes?.ok) return null;
    const searchData = await searchRes.json();
    const files: { title: string }[] = searchData?.query?.search || [];
    if (files.length === 0) return null;

    const relevant = files.filter((f) => isCommonsFileRelevant(f.title, brand, model));
    if (relevant.length === 0) return null;

    for (const file of relevant.slice(0, 4)) {
      const infoRes = await fetchWithTimeout(
        `${COMMONS_API}?action=query&titles=${encodeURIComponent(file.title)}&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=500&format=json`
      );
      if (!infoRes?.ok) continue;
      const infoData = await infoRes.json();
      const pages = Object.values(infoData?.query?.pages || {}) as {
        imageinfo?: CommonsImageInfo[];
      }[];
      const info = pages[0]?.imageinfo?.[0];
      const url = info?.thumburl || info?.url;
      if (url && isValidImageUrl(url)) return url;
    }
    return null;
  } catch {
    return null;
  }
}

function buildSearchQueries(brand: string, model: string): string[] {
  const brandLower = brand.toLowerCase();
  const modelLower = model.toLowerCase();
  const hasBrand = brand.length > 0 && modelLower.includes(brandLower);

  const modelClean = cleanModelName(model);
  const queries = new Set<string>();

  const prefix = hasBrand ? "" : brand ? brand + " " : "";

  if (modelClean && modelClean !== model) {
    queries.add(`${prefix}${modelClean} smartphone`);
    queries.add(`${prefix}${modelClean}`);
    queries.add(`${prefix}${modelClean} phone`);
    queries.add(`${prefix}${modelClean} laptop`);
    queries.add(`${prefix}${modelClean} tablet`);
  }

  queries.add(`${prefix}${model} smartphone`);
  queries.add(`${prefix}${model}`);
  queries.add(`${prefix}${model} phone`);
  queries.add(`${prefix}${model} laptop`);

  if (model !== modelClean && modelClean.split(" ").length > 1) {
    const modelFamily = modelClean.split(" ").slice(0, 2).join(" ");
    queries.add(`${prefix}${modelFamily}`);
  }

  return Array.from(queries);
}

export async function fetchDeviceImage(brand: string, model: string): Promise<string | null> {
  if (!model || model.trim().length < 2) return null;

  const queries = buildSearchQueries(brand, model);

  for (const query of queries) {
    const wikiResult = await fetchWikipediaImage(query, brand, model);
    if (wikiResult) return wikiResult;
  }

  const modelClean = cleanModelName(model);
  const cleanQueries = modelClean !== model
    ? [brand ? `${brand} ${modelClean}` : modelClean]
    : [];

  for (const query of [...cleanQueries, ...queries.slice(0, 3)]) {
    const commonsResult = await fetchWikimediaCommonsImage(query, brand, model);
    if (commonsResult) return commonsResult;
  }

  return null;
}

export interface BatchFetchResult {
  modelId: string;
  modelName: string;
  imageUrl: string | null;
  success: boolean;
}

export async function fetchDeviceImagesBatch(
  models: Array<{ id: string; modelName: string; brand: string }>
): Promise<BatchFetchResult[]> {
  const results: BatchFetchResult[] = [];

  for (const m of models) {
    const imageUrl = await fetchDeviceImage(m.brand, m.modelName);
    results.push({
      modelId: m.id,
      modelName: m.modelName,
      imageUrl,
      success: !!imageUrl,
    });
    await sleep(500);
  }

  return results;
}
