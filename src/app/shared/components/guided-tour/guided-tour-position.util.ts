import { TourPlacement, TooltipPosition, SpotlightRect } from './guided-tour.types';

const ARROW_OFFSET = 12;
const VIEWPORT_PADDING = 16;
const TOOLTIP_WIDTH = 360;
const TOOLTIP_HEIGHT_ESTIMATE = 200;

export function getSpotlightRect(domRect: DOMRect, padding: number): SpotlightRect {
  return {
    x: domRect.left - padding,
    y: domRect.top - padding,
    width: domRect.width + padding * 2,
    height: domRect.height + padding * 2,
  };
}

export function calculateTooltipPosition(
  targetRect: SpotlightRect | null,
  placement: TourPlacement,
  tooltipWidth = TOOLTIP_WIDTH,
  tooltipHeight = TOOLTIP_HEIGHT_ESTIMATE,
): TooltipPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (!targetRect || placement === 'center') {
    return {
      top: Math.max(VIEWPORT_PADDING, (vh - tooltipHeight) / 2),
      left: Math.max(VIEWPORT_PADDING, (vw - tooltipWidth) / 2),
      arrowPosition: 'none',
    };
  }

  let top = 0;
  let left = 0;
  let arrowPosition: TooltipPosition['arrowPosition'] = 'none';

  const centerX = targetRect.x + targetRect.width / 2;
  const centerY = targetRect.y + targetRect.height / 2;

  switch (placement) {
    case 'bottom':
      top = targetRect.y + targetRect.height + ARROW_OFFSET;
      left = centerX - tooltipWidth / 2;
      arrowPosition = 'top';
      break;
    case 'top':
      top = targetRect.y - tooltipHeight - ARROW_OFFSET;
      left = centerX - tooltipWidth / 2;
      arrowPosition = 'bottom';
      break;
    case 'left':
      top = centerY - tooltipHeight / 2;
      left = targetRect.x - tooltipWidth - ARROW_OFFSET;
      arrowPosition = 'right';
      break;
    case 'right':
      top = centerY - tooltipHeight / 2;
      left = targetRect.x + targetRect.width + ARROW_OFFSET;
      arrowPosition = 'left';
      break;
  }

  return clampToViewport({ top, left, arrowPosition }, tooltipWidth, tooltipHeight);
}

function clampToViewport(
  position: TooltipPosition,
  tooltipWidth: number,
  tooltipHeight: number,
): TooltipPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  return {
    ...position,
    top: Math.min(Math.max(VIEWPORT_PADDING, position.top), vh - tooltipHeight - VIEWPORT_PADDING),
    left: Math.min(Math.max(VIEWPORT_PADDING, position.left), vw - tooltipWidth - VIEWPORT_PADDING),
  };
}
