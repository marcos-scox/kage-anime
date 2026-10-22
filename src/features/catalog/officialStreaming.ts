import type { AnimeStreamingLink } from '../../types/anime';

export interface VerifiedStreamingLink {
  name: string;
  href: string;
}

interface OfficialPlatform {
  name: string;
  aliases: readonly string[];
  domains: readonly string[];
}

const OFFICIAL_PLATFORMS: readonly OfficialPlatform[] = [
  { name: 'Crunchyroll', aliases: ['crunchyroll'], domains: ['crunchyroll.com'] },
  { name: 'Netflix', aliases: ['netflix'], domains: ['netflix.com'] },
  { name: 'Prime Video', aliases: ['primevideo', 'amazonprimevideo', 'amazonprime'], domains: ['primevideo.com'] },
  { name: 'Disney+', aliases: ['disneyplus', 'disney'], domains: ['disneyplus.com'] },
  { name: 'Hulu', aliases: ['hulu'], domains: ['hulu.com'] },
  { name: 'HIDIVE', aliases: ['hidive'], domains: ['hidive.com'] },
  { name: 'Tubi', aliases: ['tubi', 'tubitv'], domains: ['tubitv.com'] },
  { name: 'Bilibili', aliases: ['bilibili'], domains: ['bilibili.tv', 'bilibili.com'] },
  { name: 'RetroCrush', aliases: ['retrocrush'], domains: ['retrocrush.tv', 'retrocrush.com'] },
  { name: 'Viki', aliases: ['viki'], domains: ['viki.com'] },
];

function normalizeProviderName(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

function matchesDomain(hostname: string, domains: readonly string[]): boolean {
  const host = hostname.toLowerCase();
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

export function getVerifiedStreamingLinks(links: readonly AnimeStreamingLink[] | null | undefined): VerifiedStreamingLink[] {
  if (!links?.length) return [];
  const verified = new Map<string, VerifiedStreamingLink>();

  for (const link of links) {
    const provider = OFFICIAL_PLATFORMS.find((candidate) => candidate.aliases.includes(normalizeProviderName(link.name)));
    if (!provider) continue;

    try {
      const url = new URL(link.url);
      if (url.protocol !== 'https:' || url.username || url.password || url.port || !matchesDomain(url.hostname, provider.domains)) continue;
      verified.set(`${provider.name}:${url.href}`, { name: provider.name, href: url.href });
    } catch {
      // Ignore malformed or non-HTTPS entries from the external catalog.
    }
  }

  return [...verified.values()];
}

export function getMyAnimeListPage(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    return host === 'myanimelist.net' || host.endsWith('.myanimelist.net') ? url.href : null;
  } catch {
    return null;
  }
}
