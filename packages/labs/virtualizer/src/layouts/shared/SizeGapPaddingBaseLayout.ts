// import { dimension } from './Layout.js';
import {BaseLayoutConfig} from './Layout.js';
import {BaseLayout} from './BaseLayout.js';
import {LogicalSize} from './Layout.js';

export type PixelSize = `${'0' | `${number}px`}`;

type GapValue = PixelSize;
type TwoGapValues = `${GapValue} ${GapValue}`;

export type ExplicitGapSpec = GapValue | TwoGapValues;

export type AutoGapSpec =
  | PixelSize
  | `${PixelSize} ${PixelSize}`
  | `auto ${PixelSize}`
  | `${PixelSize} auto`;

export type GapSpec = ExplicitGapSpec | AutoGapSpec;

type PaddingValue = PixelSize | 'match-gap';
type TwoPaddingValues = `${PaddingValue} ${PaddingValue}`;
type ThreePaddingValues = `${TwoPaddingValues} ${PaddingValue}`;
type FourPaddingValues = `${ThreePaddingValues} ${PaddingValue}`;
type PaddingSpec =
  | PaddingValue
  | TwoPaddingValues
  | ThreePaddingValues
  | FourPaddingValues;

type LogicalPixelDimensions = {inlineSize: PixelSize; blockSize: PixelSize};
type FixedPixelDimensions = {width: PixelSize; height: PixelSize};
type PixelDimensions = LogicalPixelDimensions | FixedPixelDimensions;

// function numberToPixelSize(n: number): PixelSize {
//     return n === 0 ? '0' : `${n}px`;
// }

function paddingValueToNumber(v: PaddingValue): number {
  if (v === 'match-gap') {
    return Infinity;
  }
  return parseInt(v);
}

function gapValueToNumber(v: GapValue | 'auto'): number {
  if (v === 'auto') {
    return Infinity;
  }
  return parseInt(v);
}

export function gap1(): 'row' | 'column' {
  return 'row';
}

export function gap2(): 'row' | 'column' {
  return 'column';
}

export function padding1(): [side, side] {
  return ['top', 'bottom'];
}

export function padding2(): [side, side] {
  return ['left', 'right'];
}

export interface SizeGapPaddingBaseLayoutConfig extends BaseLayoutConfig {
  // gap?: GapSpec,
  padding?: PaddingSpec;
  itemSize?: PixelDimensions | PixelSize;
}

type gap = 'row' | 'column';
type side = 'top' | 'right' | 'bottom' | 'left';
type Gaps = {[key in gap]: number};
type Padding = {[key in side]: number};

export abstract class SizeGapPaddingBaseLayout<
  C extends SizeGapPaddingBaseLayoutConfig
> extends BaseLayout<C> {
  protected _itemSize: LogicalSize | {} = {};
  protected _gaps: Gaps | {} = {};
  protected _padding: Padding | {} = {};
  protected _lastGapSpec: GapSpec | '' = '';
  protected _lastPaddingSpec: PaddingSpec | '' = '';

  protected get _defaultConfig(): C {
    return Object.assign({}, super._defaultConfig, {
      itemSize: {width: '300px', height: '300px'},
      gap: '8px',
      padding: 'match-gap',
    }) as C;
  }

  // Temp, to support current flexWrap implementation
  protected get _gap(): number {
    return (this._gaps as Gaps).row;
  }

  // Temp, to support current flexWrap implementation
  protected get _idealSize(): number {
    return (this._itemSize as LogicalSize).blockSize;
  }

  protected get _idealSize1(): number {
    return (this._itemSize as LogicalSize).blockSize;
  }

  protected get _idealSize2(): number {
    return (this._itemSize as LogicalSize).inlineSize;
  }

  protected get _gap1(): number {
    return (this._gaps as Gaps)[gap1()];
  }

  protected get _gap2(): number {
    return (this._gaps as Gaps)[gap2()];
  }

  protected get _padding1(): [number, number] {
    const padding = this._padding as Padding;
    const [start, end] = padding1();
    return [padding[start], padding[end]];
  }

  protected get _padding2(): [number, number] {
    const padding = this._padding as Padding;
    const [start, end] = padding2();
    return [padding[start], padding[end]];
  }

  set itemSize(dims: PixelDimensions | PixelSize) {
    const size = this._itemSize as LogicalSize;
    let normalizedDims: LogicalPixelDimensions;
    if (typeof dims === 'string') {
      normalizedDims = {
        inlineSize: dims,
        blockSize: dims,
      };
    } else if ((dims as FixedPixelDimensions).width !== undefined) {
      normalizedDims = {
        inlineSize: (dims as FixedPixelDimensions).width,
        blockSize: (dims as FixedPixelDimensions).height,
      };
    } else {
      normalizedDims = dims as LogicalPixelDimensions;
    }

    const inlineSize = parseInt(normalizedDims.inlineSize);
    const blockSize = parseInt(normalizedDims.blockSize);
    if (inlineSize !== size.inlineSize) {
      size.inlineSize = inlineSize;
      this._triggerReflow();
    }
    if (blockSize !== size.blockSize) {
      size.blockSize = blockSize;
      this._triggerReflow();
    }
  }

  // This setter is overridden in specific layouts to narrow the accepted types
  set gap(spec: GapSpec) {
    if (spec !== this._lastGapSpec) {
      const values = spec
        .split(' ')
        .map((v) => gapValueToNumber(v as GapValue));
      const gaps = this._gaps as Gaps;
      gaps.row = values[0];
      if (values[1] === undefined) {
        gaps.column = values[0];
      } else {
        gaps.column = values[1];
      }
      this._lastGapSpec = spec;
      this._triggerReflow();
    }
  }

  set padding(spec: PaddingSpec) {
    if (spec !== this._lastPaddingSpec) {
      const padding = this._padding as Padding;
      const values = spec
        .split(' ')
        .map((v) => paddingValueToNumber(v as PaddingValue));
      if (values.length === 1) {
        padding.top = padding.right = padding.bottom = padding.left = values[0];
      } else if (values.length === 2) {
        padding.top = padding.bottom = values[0];
        padding.right = padding.left = values[1];
      } else if (values.length === 3) {
        padding.top = values[0];
        padding.right = padding.left = values[1];
        padding.bottom = values[2];
      } else if (values.length === 4) {
        padding.top = values[0];
        padding.right = values[1];
        padding.bottom = values[2];
        padding.left = values[3];
      }
      this._lastPaddingSpec = spec;
      this._triggerReflow();
    }
  }
}
