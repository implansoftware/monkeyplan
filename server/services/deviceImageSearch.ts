
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
];

function isValidImageUrl(src: string): boolean {
  const lower = src.toLowerCase();
  return !GENERIC_IMAGE_PATTERNS.some((p) => lower.includes(p));
}

function isTitleRelevant(title: string, brand: string, model: string): boolean {
  const titleLower = title.toLowerCase();
  const brandLower = brand.toLowerCase();
  const modelKey = stripSizeSuffix(model).toLowerCase().split(" ")[0];

  if (titleLower === brandLower) return false;
  if (titleLower.startsWith("list of")) return false;

  const COMPANY_SUFFIXES = [" inc.", " inc,", " corp.", " ltd.", " co.", " group", " holdings",
    "(company)", "(brand)", "(manufacturer)", "(corporation)", "silicon", " plc", " sa", " ag", " gmbh"];
  if (COMPANY_SUFFIXES.some(s => titleLower.includes(s))) return false;

  if (!titleLower.includes(modelKey) && modelKey.length > 1) return false;
  return true;
}

function isCommonsFileRelevant(filename: string, brand: string, model: string): boolean {
  const lower = filename.toLowerCase();
  if (GENERIC_IMAGE_PATTERNS.some((p) => lower.includes(p))) return false;
  const brandLower = brand.toLowerCase();
  const modelKey = stripSizeSuffix(model).toLowerCase().split(" ")[0];
  return lower.includes(brandLower) || lower.includes(modelKey);
}

function stripSizeSuffix(name: string): string {
  return name
    .replace(/\s*\(.*?(mm|cm|inch|")\)/gi, "")
    .replace(/\s*[-–]\s*\d+\s*(mm|cm|gb|tb)/gi, "")
    .replace(/\s*\(\d+(st|nd|rd|th)\s+gen.*?\)/gi, "")
    .trim();
}

async function fetchWithTimeout(url: string, timeoutMs = 6000): Promise<Response | null> {
  try {
    return await fetch(url, {
      headers: { "User-Agent": "MonkeyPlan/1.0 (repair-management; contact@monkeyplan.it)" },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return null;
  }
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
  const alreadyHasBrand = modelLower.includes(brandLower);
  const modelStripped = stripSizeSuffix(model);
  const queries = new Set<string>();

  if (alreadyHasBrand) {
    queries.add(`${model} smartphone`);
    queries.add(model);
    queries.add(`${model} phone`);
    queries.add(`${model} laptop`);
    if (modelStripped !== model) {
      queries.add(`${modelStripped} smartphone`);
      queries.add(modelStripped);
    }
  } else {
    queries.add(`${brand} ${model} smartphone`);
    queries.add(`${brand} ${model}`);
    queries.add(`${brand} ${model} phone`);
    queries.add(`${brand} ${model} laptop`);
    if (modelStripped !== model) {
      queries.add(`${brand} ${modelStripped} smartphone`);
      queries.add(`${brand} ${modelStripped}`);
    }
  }

  return Array.from(queries);
}

export async function fetchDeviceImage(brand: string, model: string): Promise<string | null> {
  const queries = buildSearchQueries(brand, model);

  for (const query of queries) {
    const wikiResult = await fetchWikipediaImage(query, brand, model);
    if (wikiResult) return wikiResult;
  }

  for (const query of queries.slice(0, 4)) {
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
  const CONCURRENCY = 5;
  const results: BatchFetchResult[] = [];

  for (let i = 0; i < models.length; i += CONCURRENCY) {
    const chunk = models.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map(async (m) => {
        const imageUrl = await fetchDeviceImage(m.brand, m.modelName);
        return {
          modelId: m.id,
          modelName: m.modelName,
          imageUrl,
          success: !!imageUrl,
        };
      })
    );
    results.push(...chunkResults);
    if (i + CONCURRENCY < models.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return results;
}
