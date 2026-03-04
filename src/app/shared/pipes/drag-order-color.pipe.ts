import { Pipe, PipeTransform } from '@angular/core';
import { GROUP_COLORS } from '../../features/overlay/overlay-drag-order.service';

@Pipe({ name: 'dragOrderColor', standalone: true })
export class DragOrderColorPipe implements PipeTransform {
  transform(colorIndex: number): string {
    return GROUP_COLORS[colorIndex % GROUP_COLORS.length] ?? GROUP_COLORS[0];
  }
}
