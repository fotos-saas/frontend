export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';
export type HighlightType = 'spotlight' | 'border' | 'none';

export interface TourStep {
  targetSelector?: string;
  title: string;
  description: string;
  placement?: TourPlacement;
  highlightType?: HighlightType;
  spotlightPadding?: number;
}

export interface Tour {
  id: string;
  name: string;
  steps: TourStep[];
  autoStart?: boolean;
}

export interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right' | 'none';
}

export interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
