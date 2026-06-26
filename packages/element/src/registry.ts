import type { DriftSliderModule } from 'drift-slider';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const registry = new Map<string, DriftSliderModule>();

export function registerModules(map: Record<string, DriftSliderModule>): void {
  for (const [name, mod] of Object.entries(map)) registry.set(norm(name), mod);
}

export function resolveModuleNames(names: string[]): DriftSliderModule[] {
  const out: DriftSliderModule[] = [];
  for (const raw of names) {
    const key = norm(raw);
    if (!key) continue;
    const mod = registry.get(key);
    if (mod) out.push(mod);
    else console.warn(`DriftSlider: unknown module "${raw}", ignoring`);
  }
  return out;
}

// 'fade' -> the EffectFade module (registered as 'effectfade')
export function moduleForEffect(effect: string): DriftSliderModule | undefined {
  return registry.get(`effect${norm(effect)}`);
}

export function clearRegistry(): void {
  registry.clear();
}
