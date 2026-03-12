import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ICONS } from '@shared/constants/icons.constants';
import { DragOrderColorPipe } from '@shared/pipes/drag-order-color.pipe';
import { OverlayDragOrderService } from '../../overlay-drag-order.service';
import { PersonItem } from '../../overlay-project.service';

@Component({
  selector: 'app-overlay-drag-order-panel',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, DragDropModule, DragOrderColorPipe],
  templateUrl: './overlay-drag-order-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayDragOrderPanelComponent {
  protected readonly ICONS = ICONS;
  readonly closePanel = output<void>();
  readonly dragOrder = inject(OverlayDragOrderService);

  // Signal aliasok a template-hez
  readonly dragOrderSaving = this.dragOrder.saving;
  readonly dragOrderRefreshing = this.dragOrder.refreshing;
  readonly dragOrderScope = this.dragOrder.scope;
  readonly dragOrderList = this.dragOrder.filteredList;
  readonly dragOrderSearchQuery = this.dragOrder.searchQuery;
  readonly dragOrderSelected = this.dragOrder.selected;
  readonly dragOrderGenderLoading = this.dragOrder.genderLoading;
  readonly dragOrderGroups = this.dragOrder.filteredGroups;
  readonly dragOrderUngrouped = this.dragOrder.filteredUngrouped;
  readonly dragOrderHasGroups = this.dragOrder.hasGroups;
  readonly dragOrderUngroupedRaw = this.dragOrder.ungrouped;
  readonly dragOrderCustomOpen = this.dragOrder.customOrderOpen;
  readonly dragOrderCustomText = this.dragOrder.customOrderText;
  readonly dragOrderCustomLoading = this.dragOrder.customOrderLoading;
  readonly dragOrderCustomResult = this.dragOrder.customOrderResult;

  onClose(): void { this.closePanel.emit(); }
  clearDragOrderSelection(): void { this.dragOrder.clearSelection(); }
  setDragOrderScope(scope: 'all' | 'teachers' | 'students'): void { this.dragOrder.setScope(scope); }
  toggleDragOrderSelect(personId: number, event: MouseEvent): void { this.dragOrder.toggleSelect(personId, event); }
  isDragOrderSelected(personId: number): boolean { return this.dragOrder.isSelected(personId); }
  dragOrderSortAbc(): void { this.dragOrder.sortAbc(); }
  dragOrderSortGender(): Promise<void> { return this.dragOrder.sortGender(); }
  dragOrderSortLeadership(): void { this.dragOrder.sortLeadership(); }
  dragOrderSortClassTeachersLast(): void { this.dragOrder.sortClassTeachersLast(); }
  saveDragOrder(): Promise<void> { return this.dragOrder.save(); }
  refreshDragOrder(): Promise<void> { return this.dragOrder.refreshFromDb(); }
  setDragOrderSearch(value: string): void { this.dragOrder.searchQuery.set(value); }
  createDragOrderGroup(): void { this.dragOrder.createGroup('Új csoport'); }
  createDragOrderGroupFromSelection(): void { this.dragOrder.createGroupFromSelection('Új csoport'); }
  removeDragOrderGroup(id: string): void { this.dragOrder.removeGroup(id); }
  toggleDragOrderGroupCollapse(id: string): void { this.dragOrder.toggleGroupCollapse(id); }
  moveDragOrderGroup(id: string, direction: -1 | 1): void { this.dragOrder.moveGroup(id, direction); }
  onDropToGroup(event: CdkDragDrop<PersonItem[]>, groupId: string): void { this.dragOrder.onDropToGroup(event, groupId); }
  onDropToUngrouped(event: CdkDragDrop<PersonItem[]>): void { this.dragOrder.onDropToUngrouped(event); }

  onDragOrderGroupNameBlur(event: FocusEvent, groupId: string): void {
    const el = event.target as HTMLElement;
    const name = el.textContent?.trim();
    if (name) this.dragOrder.renameGroup(groupId, name);
    else el.textContent = this.dragOrder.groups().find(g => g.id === groupId)?.name ?? 'Csoport';
  }

  onDragOrderGroupNameKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') { event.preventDefault(); (event.target as HTMLElement).blur(); }
  }
}
