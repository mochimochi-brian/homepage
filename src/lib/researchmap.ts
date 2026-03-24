const RESEARCHMAP_BASE = 'https://api.researchmap.jp';
const RESEARCHER_ID = 'burai';

export interface Publication {
  title: { ja?: string; en?: string };
  authors: { ja?: string[]; en?: string[] };
  journal: string;
  volume?: string;
  number?: string;
  startPage?: string;
  endPage?: string;
  year: number;
  date?: string;
  doi?: string;
  refereed: boolean;
}

export interface Presentation {
  title: { ja?: string; en?: string };
  presenters: { ja?: string[]; en?: string[] };
  event: string;
  date?: string;
  year: number;
  isInternational: boolean;
  isInvited: boolean;
}

interface ResearchmapResponse<T> {
  total_items: number;
  items: T[];
}

async function fetchResearchmap<T>(endpoint: string): Promise<T[]> {
  try {
    const res = await fetch(
      `${RESEARCHMAP_BASE}/${RESEARCHER_ID}/${endpoint}?limit=1000`
    );
    if (!res.ok) {
      console.warn(`researchmap API error: ${res.status} for ${endpoint}`);
      return [];
    }
    const data: ResearchmapResponse<T> = await res.json();
    return data.items ?? [];
  } catch (e) {
    console.warn(`researchmap fetch failed for ${endpoint}:`, e);
    return [];
  }
}

function extractYear(dateStr?: string): number {
  if (!dateStr) return 0;
  const match = dateStr.match(/^(\d{4})/);
  return match ? parseInt(match[1], 10) : 0;
}

function extractText(
  field: Record<string, string> | undefined,
  lang: 'ja' | 'en'
): string {
  if (!field) return '';
  return field[lang] ?? field[lang === 'ja' ? 'en' : 'ja'] ?? '';
}

function extractAuthors(
  field: Record<string, unknown> | undefined
): { ja?: string[]; en?: string[] } {
  if (!field) return {};
  const result: { ja?: string[]; en?: string[] } = {};
  if (field.ja) {
    result.ja = Array.isArray(field.ja)
      ? (field.ja as Array<{ author_name?: string }>).map((a) => a.author_name ?? '')
      : [String(field.ja)];
  }
  if (field.en) {
    result.en = Array.isArray(field.en)
      ? (field.en as Array<{ author_name?: string }>).map((a) => a.author_name ?? '')
      : [String(field.en)];
  }
  return result;
}

function findDoi(identifiers?: Record<string, unknown>): string | undefined {
  if (!identifiers || typeof identifiers !== 'object') return undefined;
  const doiArray = identifiers.doi;
  if (Array.isArray(doiArray) && doiArray.length > 0) {
    return String(doiArray[0]);
  }
  return undefined;
}

export async function getPublications(): Promise<Publication[]> {
  const raw = await fetchResearchmap<Record<string, unknown>>('published_papers');

  return raw
    .map((item) => {
      const date = item.publication_date as string | undefined;
      return {
        title: {
          ja: extractText(item.paper_title as Record<string, string>, 'ja'),
          en: extractText(item.paper_title as Record<string, string>, 'en'),
        },
        authors: extractAuthors(item.authors as Record<string, unknown>),
        journal: extractText(item.publication_name as Record<string, string>, 'en')
          || extractText(item.publication_name as Record<string, string>, 'ja'),
        volume: item.volume as string | undefined,
        number: item.number as string | undefined,
        startPage: item.starting_page as string | undefined,
        endPage: item.ending_page as string | undefined,
        year: extractYear(date),
        date,
        doi: findDoi(item.identifiers as Record<string, unknown>),
        refereed: item.referee === true,
      };
    })
    .sort((a, b) => b.year - a.year || (b.date ?? '').localeCompare(a.date ?? ''));
}

export async function getPresentations(): Promise<Presentation[]> {
  const raw = await fetchResearchmap<Record<string, unknown>>('presentations');

  return raw
    .map((item) => {
      const date = item.publication_date as string | undefined;
      return {
        title: {
          ja: extractText(item.presentation_title as Record<string, string>, 'ja'),
          en: extractText(item.presentation_title as Record<string, string>, 'en'),
        },
        presenters: extractAuthors(item.presenters as Record<string, unknown>),
        event: extractText(item.event as Record<string, string>, 'ja')
          || extractText(item.event as Record<string, string>, 'en'),
        date,
        year: extractYear(date),
        isInternational: item.is_international_presentation === true,
        isInvited: item.invited === true,
      };
    })
    .sort((a, b) => b.year - a.year || (b.date ?? '').localeCompare(a.date ?? ''));
}
