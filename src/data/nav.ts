import { getCollection } from 'astro:content';

export const SECTION_ORDER = [
  'Getting Started',
  'Authentication',
  'API Surface',
  'Operations',
  'Project',
] as const;

export type DocEntry = {
  slug: string;
  title: string;
  description: string;
  section: string;
  order: number;
};

export async function getDocNav(): Promise<{ section: string; items: DocEntry[] }[]> {
  const entries = await getCollection('docs');

  const mapped: DocEntry[] = entries.map((e) => ({
    slug: e.id,
    title: e.data.title,
    description: e.data.description,
    section: e.data.section,
    order: e.data.order,
  }));

  return SECTION_ORDER.map((section) => ({
    section,
    items: mapped
      .filter((d) => d.section === section)
      .sort((a, b) => a.order - b.order),
  })).filter((g) => g.items.length > 0);
}
