import { getCollection } from 'astro:content';

export const SECTION_ORDER = [
  'Getting Started',
  'Authentication',
  'API Surface',
  'Operations',
  'Internal Admin',
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

// ── Official package docs ───────────────────────────────────────────────────

export const PACKAGE_SECTION_ORDER = ['Overview', 'Usage', 'Admin API'] as const;

export type PackageMeta = {
  slug: string; // e.g. "laravel-coupon"
  name: string; // display name
  tagline: string;
  badge: string; // single-letter badge shown in the sidebar / cards
  repo: string; // GitHub URL
};

export const PACKAGES: PackageMeta[] = [
  {
    slug: 'laravel-coupon',
    name: 'laravel-coupon',
    tagline: 'Coupon generation, validation & redemption — decoupled from billing.',
    badge: 'C',
    repo: 'https://github.com/mrsuner/laravel-coupon',
  },
  {
    slug: 'laravel-api-keys',
    name: 'laravel-api-keys',
    tagline: 'Developer API keys — prefix-routed, rotatable, rate-limited, layered over Sanctum.',
    badge: 'K',
    repo: 'https://github.com/mrsuner/laravel-api-boilerplate-apikey',
  },
];

/**
 * Build the grouped sidebar nav for a single package's docs tree.
 * Entry ids are "<package>/<page>"; hrefs are "/packages/<package>/<page>".
 */
export async function getPackageNav(
  pkg: string,
): Promise<{ section: string; items: DocEntry[] }[]> {
  const entries = await getCollection('packages');

  const mapped: DocEntry[] = entries
    .filter((e) => e.id.startsWith(`${pkg}/`))
    .map((e) => ({
      slug: e.id,
      title: e.data.title,
      description: e.data.description,
      section: e.data.section,
      order: e.data.order,
    }));

  return PACKAGE_SECTION_ORDER.map((section) => ({
    section,
    items: mapped
      .filter((d) => d.section === section)
      .sort((a, b) => a.order - b.order),
  })).filter((g) => g.items.length > 0);
}
