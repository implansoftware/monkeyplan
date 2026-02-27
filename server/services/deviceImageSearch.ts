
const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const WIKIPEDIA_IT_API = "https://it.wikipedia.org/w/api.php";

interface WikiSearchResult {
  title: string;
  thumbnail?: { source: string; width: number; height: number };
}

async function fetchWikipediaImage(query: string): Promise<string | null> {
  try {
    const searchUrl = `${WIKIPEDIA_API}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=3&origin=*`;
    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": "MonkeyPlan/1.0 (repair management software)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const results: { title: string }[] = searchData?.query?.search || [];
    if (results.length === 0) return null;

    for (const result of results) {
      const pageUrl = `${WIKIPEDIA_API}?action=query&titles=${encodeURIComponent(result.title)}&prop=pageimages&format=json&pithumbsize=500&redirects=1&origin=*`;
      const pageRes = await fetch(pageUrl, {
        headers: { "User-Agent": "MonkeyPlan/1.0 (repair management software)" },
        signal: AbortSignal.timeout(8000),
      });
      if (!pageRes.ok) continue;
      const pageData = await pageRes.json();
      const pages = Object.values(pageData?.query?.pages || {}) as WikiSearchResult[];
      const page = pages[0];
      if (page?.thumbnail?.source) {
        const src = page.thumbnail.source;
        if (src.includes("flag") || src.includes("logo") || src.includes("map") || src.includes("icon")) continue;
        return src;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function buildSearchQueries(brand: string, model: string): string[] {
  const brandLower = brand.toLowerCase();
  const modelLower = model.toLowerCase();

  const alreadyHasBrand = modelLower.startsWith(brandLower) ||
    modelLower.includes(brandLower);

  if (alreadyHasBrand) {
    return [
      `${model} smartphone`,
      `${model} phone`,
      model,
    ];
  }

  return [
    `${brand} ${model} smartphone`,
    `${brand} ${model}`,
    `${brand} ${model} phone`,
  ];
}

export async function fetchDeviceImage(brand: string, model: string): Promise<string | null> {
  const queries = buildSearchQueries(brand, model);

  for (const query of queries) {
    const result = await fetchWikipediaImage(query);
    if (result) return result;
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
  const CONCURRENCY = 3;
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
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return results;
}
