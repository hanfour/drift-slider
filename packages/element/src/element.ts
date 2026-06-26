import CoreDriftSlider from 'drift-slider';
import type { DriftSliderOptions, DriftSliderModule } from 'drift-slider';
import { OBSERVED_ATTRIBUTES } from './attributes';

const UPGRADE_PROPS = ['config', 'modules'] as const;

export class DriftSliderElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return OBSERVED_ATTRIBUTES;
  }

  private _slider: CoreDriftSlider | null = null;
  private _config: DriftSliderOptions = {};
  private _modules: DriftSliderModule[] = [];
  private _initPending = false;

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

  get config(): DriftSliderOptions {
    return this._config;
  }
  set config(value: DriftSliderOptions) {
    this._config = value ?? {};
  }

  get modules(): DriftSliderModule[] {
    return this._modules;
  }
  set modules(value: DriftSliderModule[]) {
    this._modules = value ?? [];
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
    // re-init wiring lands in Task 6
  }

  private _buildOptions(): DriftSliderOptions {
    return { ...this._config, modules: this._modules };
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
