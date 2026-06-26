// Attrs that map to a module toggle (presence = include that registered module)
export const MODULE_ATTRS: Record<string, string> = {
  navigation: 'navigation',
  pagination: 'pagination',
  keyboard: 'keyboard',
  autoplay: 'autoplay',
};

// Attrs that map to a core option key (after attrToOption)
export const OPTION_ATTRS = new Set<string>([
  'loop', 'slides-per-view', 'space-between', 'effect', 'direction',
  'speed', 'initial-slide', 'centered-slides',
]);

const BOOLEAN_ATTRS = new Set<string>([
  'loop', 'centered-slides', ...Object.keys(MODULE_ATTRS),
]);
const NUMBER_ATTRS = new Set<string>([
  'slides-per-view', 'space-between', 'speed', 'initial-slide',
]);

export const OBSERVED_ATTRIBUTES: string[] = [
  'config', 'modules', 'effect', 'direction',
  ...OPTION_ATTRS, ...Object.keys(MODULE_ATTRS),
].filter((v, i, a) => a.indexOf(v) === i);

export function coerceAttr(name: string, value: string | null): unknown {
  if (BOOLEAN_ATTRS.has(name)) return value !== null && value !== 'false';
  if (NUMBER_ATTRS.has(name)) {
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }
  return value ?? undefined;
}

export function attrToOption(name: string): string {
  return name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}
