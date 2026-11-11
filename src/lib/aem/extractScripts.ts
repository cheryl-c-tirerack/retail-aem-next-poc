import 'server-only';

import { type AemTag, type FragmentName, KEEP_LIST } from './keepList';

export type KeptTag = AemTag & { id: string };

export type ParsedFragment = {
  /** Fragment HTML with every script, stylesheet link and style block removed. */
  html: string;
  /** Tags on the keep list, in source order. */
  kept: KeptTag[];
  /** Short descriptions of dropped tags, for the server log and the report. */
  dropped: string[];
};

const SCRIPT_PATTERN = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const LINK_PATTERN = /<link\b[^>]*>/gi;
const STYLE_PATTERN = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
const TAG_PATTERN = new RegExp(`${SCRIPT_PATTERN.source}|${LINK_PATTERN.source}|${STYLE_PATTERN.source}`, 'gi');

function readAttribute(attributes: string, name: string): string | null {
  const match = new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i').exec(attributes);
  return match ? match[1] : null;
}

function toTag(raw: string): AemTag | null {
  const script = /^<script\b([^>]*)>([\s\S]*?)<\/script>$/i.exec(raw);
  if (script) {
    const src = readAttribute(script[1], 'src');
    return src ? { kind: 'script', src, code: '' } : { kind: 'script', src: null, code: script[2] };
  }

  const style = /^<style\b[^>]*>([\s\S]*?)<\/style>$/i.exec(raw);
  if (style) {
    return { kind: 'style', css: style[1] };
  }

  const rel = readAttribute(raw, 'rel');
  const href = readAttribute(raw, 'href');
  if (rel?.toLowerCase() === 'stylesheet' && href) {
    return { kind: 'stylesheet', href };
  }

  return null;
}

function describe(tag: AemTag | null, raw: string): string {
  if (tag?.kind === 'script') {
    return tag.src ?? `inline script: ${tag.code.trim().replace(/\s+/g, ' ').slice(0, 60)}`;
  }
  if (tag?.kind === 'stylesheet') {
    return tag.href;
  }
  return raw.replace(/\s+/g, ' ').slice(0, 80);
}

/**
 * Splits an AEM fragment into its markup and the tags on the keep list.
 * Nothing that is not on the keep list reaches the page.
 */
export function parseFragment(fragmentHtml: string, fragment: FragmentName): ParsedFragment {
  const rules = KEEP_LIST.filter((rule) => rule.fragment === fragment);
  const kept: KeptTag[] = [];
  const dropped: string[] = [];
  const usedIds = new Set<string>();

  const html = fragmentHtml.replace(TAG_PATTERN, (raw) => {
    const tag = toTag(raw);
    const rule = tag ? rules.find((candidate) => candidate.match(tag)) : undefined;

    if (tag && rule) {
      const id = usedIds.has(rule.name) ? `${rule.name}-${usedIds.size}` : rule.name;
      usedIds.add(id);
      kept.push({ ...tag, id });
    } else {
      dropped.push(describe(tag, raw));
    }

    return '';
  });

  return { html, kept, dropped };
}
