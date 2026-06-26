import CoreDriftSlider from 'drift-slider';
import type { DriftSliderOptions, DriftSliderModule } from 'drift-slider';
import { OBSERVED_ATTRIBUTES, OPTION_ATTRS, MODULE_ATTRS, coerceAttr, attrToOption } from './attributes';
import { resolveModuleNames, moduleForEffect } from './registry';
import { CORE_EVENTS, eventName, buildDetail } from './events';

const UPGRADE_PROPS = ['config', 'modules'] as const;

export class DriftSliderElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return OBSERVED_ATTRIBUTES;
  }

  private _slider: CoreDriftSlider | null = null;
  private _config: DriftSliderOptions = {};
  private _modules: DriftSliderModule[] = [];
  private _initPending = false;
  private _reinitQueued = false;

  constructor() {
    super();
    // property-upgrade: route any props set before define through the setters
    for (const prop of UPGRADE_PROPS) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const value = (this as Record<string, unknown>)[prop];
        delete (this as Record<string, unknown>)[prop];
        (this as Record<string, unknown>)[prop] = value;
      }
    }
  }

  get instance(): CoreDriftSlider | null {
    return this._slider;
  }

  get activeIndex(): number {
    return this._slider ? this._slider.realIndex : -1;
  }

  slideTo(index: number, speed?: number, runCallbacks?: boolean): CoreDriftSlider | undefined { return this._slider?.slideTo(index, speed, runCallbacks); }
  slideNext(speed?: number): CoreDriftSlider | undefined { return this._slider?.slideNext(speed); }
  slidePrev(speed?: number): CoreDriftSlider | undefined { return this._slider?.slidePrev(speed); }
  update(): void {
    this._slider?.update();
  }
  destroy(): void {
    this._initPending = false;
    this._slider?.destroy();
    this._slider = null;
  }

  get config(): DriftSliderOptions {
    return this._config;
  }
  set config(value: DriftSliderOptions) {
    this._config = value ?? {};
    this._scheduleReinit();
  }

  get modules(): DriftSliderModule[] {
    return this._modules;
  }
  set modules(value: DriftSliderModule[]) {
    this._modules = value ?? [];
    this._scheduleReinit();
  }

  private _scheduleReinit(): void {
    if (this._reinitQueued) return;
    this._reinitQueued = true;
    queueMicrotask(() => {
      this._reinitQueued = false;
      if (this._slider) {
        this._slider.destroy();
        this._slider = null;
        this._init();
      }
    });
  }

  connectedCallback(): void {
    this._initPending = true;
    queueMicrotask(() => {
      if (this.isConnected && this._initPending) this._init();
    });
  }

  disconnectedCallback(): void {
    this._initPending = false;
    this._slider?.destroy();
    this._slider = null;
  }

  attributeChangedCallback(): void {
    if (this._slider) this._scheduleReinit();
  }

  private _attrOptions(): DriftSliderOptions {
    const out: Record<string, unknown> = {};
    const json = this.getAttribute('config');
    if (json) {
      try { Object.assign(out, JSON.parse(json)); }
      catch { console.warn('DriftSlider: invalid JSON in config attribute'); }
    }
    for (const attr of OPTION_ATTRS) {
      if (!this.hasAttribute(attr)) continue;
      const value = coerceAttr(attr, this.getAttribute(attr));
      if (value !== undefined) out[attrToOption(attr)] = value;
    }
    return out as DriftSliderOptions;
  }

  private _buildModules(): DriftSliderModule[] {
    const mods = new Set<DriftSliderModule>([...(this._modules ?? []), ...((this._config.modules as DriftSliderModule[] | undefined) ?? [])]);

    const attr = this.getAttribute('modules');
    if (attr) for (const m of resolveModuleNames(attr.split(/[\s,]+/))) mods.add(m);

    for (const [attrName, regName] of Object.entries(MODULE_ATTRS)) {
      if (this.hasAttribute(attrName) && coerceAttr(attrName, this.getAttribute(attrName))) {
        for (const m of resolveModuleNames([regName])) mods.add(m);
      }
    }

    const effect = this.getAttribute('effect') ?? (this._config as { effect?: string }).effect;
    if (effect) { const m = moduleForEffect(effect); if (m) mods.add(m); }

    return [...mods];
  }

  private _buildOn(): Record<string, (...args: unknown[]) => void> {
    const userOn = (this._config.on ?? {}) as Record<string, ((...a: unknown[]) => void) | undefined>;
    const on: Record<string, (...args: unknown[]) => void> = {};
    for (const core of CORE_EVENTS) {
      on[core] = (slider: unknown, ...rest: unknown[]) => {
        const detail = core === 'destroy'
          ? {}
          : buildDetail(slider as Parameters<typeof buildDetail>[0]);
        this.dispatchEvent(new CustomEvent(eventName(core), { detail, bubbles: true, composed: false }));
        userOn[core]?.(slider, ...rest);
      };
    }
    return on;
  }

  private _buildOptions(): DriftSliderOptions {
    const fromAttrs = this._attrOptions();
    // property wins; warn on conflict (skip 'on' — it's handled via _buildOn)
    for (const key of Object.keys(this._config)) {
      if (key !== 'on' && key in fromAttrs) {
        console.warn(`DriftSlider: property config.${key} overrides the conflicting attribute`);
      }
    }
    const { on: _omit, ...configRest } = this._config as DriftSliderOptions & { on?: unknown };
    return {
      ...fromAttrs,
      ...configRest,
      modules: this._buildModules(),
      on: this._buildOn(),
    } as DriftSliderOptions;
  }

  private _ensureScaffold(): void {
    if (this.querySelector(':scope > .drift-track > .drift-list')) return;

    const active = document.activeElement;
    const restoreFocus = active instanceof HTMLElement && this.contains(active) ? active : null;

    const list = document.createElement('ul');
    list.className = 'drift-list';

    const SKIP = new Set(['TEMPLATE', 'SCRIPT', 'STYLE']);
    const leaveOutside: Node[] = [];
    const children = Array.from(this.childNodes);
    for (const node of children) {
      if (node.nodeType === Node.ELEMENT_NODE && !SKIP.has((node as Element).tagName)) {
        const el = node as Element;
        if (!el.classList.contains('drift-slide')) el.classList.add('drift-slide');
        list.appendChild(node); // move (preserves ids, aria, listeners)
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        leaveOutside.push(node);
      }
      // text/comment nodes are dropped from the slide area
    }

    const track = document.createElement('div');
    track.className = 'drift-track';
    track.appendChild(list);
    this.replaceChildren(track, ...leaveOutside);

    if (restoreFocus) restoreFocus.focus();
  }

  private _init(): void {
    this._initPending = false;
    try {
      this._ensureScaffold();
    } catch (error) {
      this.dispatchEvent(new CustomEvent('drift:error', { detail: { error }, bubbles: true }));
      return;
    }
    this._slider = new CoreDriftSlider(this, this._buildOptions());
  }
}
