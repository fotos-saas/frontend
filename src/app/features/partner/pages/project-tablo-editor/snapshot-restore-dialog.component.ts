import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { SnapshotLayer } from '@core/services/electron.types';

/** Fa csomópont a csoport-választóhoz */
interface GroupNode {
  name: string;
  path: string[];
  layerCount: number;
  children: GroupNode[];
}

/**
 * SnapshotRestoreDialogComponent — Csoport-választó fa a visszaállításhoz
 *
 * A snapshot layers[] tömbjéből fa struktúrát épít a groupPath-ok alapján,
 * és a felhasználó kiválaszthatja melyik csoportokat akarja visszaállítani.
 */
@Component({
  selector: 'app-snapshot-restore-dialog',
  standalone: true,
  imports: [LucideAngularModule, DialogWrapperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-wrapper
      headerStyle="flat"
      theme="purple"
      [icon]="ICONS.UNDO"
      title="Visszaállítás — csoportválasztó"
      description="Válaszd ki, melyik csoportok layereit szeretnéd visszaállítani."
      size="sm"
      [isSubmitting]="isRestoring()"
      (closeEvent)="closeEvent.emit()"
    >
      <div dialogBody>
        <div class="restore-tree">
          @for (node of groupTree(); track node.name) {
            <label class="restore-tree__node">
              <input
                type="checkbox"
                [checked]="isChecked(node.path)"
                (change)="toggleNode(node)"
              />
              <lucide-icon [name]="ICONS.FOLDER" [size]="16" />
              <span class="restore-tree__name">{{ node.name }}</span>
              <span class="restore-tree__count">{{ node.layerCount }} layer</span>
            </label>
            @for (child of node.children; track child.name) {
              <label class="restore-tree__node restore-tree__node--child">
                <input
                  type="checkbox"
                  [checked]="isChecked(child.path)"
                  (change)="toggleNode(child)"
                />
                <lucide-icon [name]="ICONS.FOLDER" [size]="14" />
                <span class="restore-tree__name">{{ child.name }}</span>
                <span class="restore-tree__count">{{ child.layerCount }} layer</span>
              </label>
            }
          }
          @if (rootLayerCount() > 0) {
            <label class="restore-tree__node">
              <input
                type="checkbox"
                [checked]="isChecked([])"
                (change)="toggleRoot()"
              />
              <lucide-icon [name]="ICONS.LAYERS" [size]="16" />
              <span class="restore-tree__name">Gyökér layerek</span>
              <span class="restore-tree__count">{{ rootLayerCount() }} layer</span>
            </label>
          }
        </div>

        <p class="restore-summary">
          Összesen: {{ selectedLayerCount() }} / {{ totalLayerCount() }} layer kiválasztva
        </p>
      </div>

      <div dialogFooter>
        <button class="btn btn--outline" (click)="closeEvent.emit()">
          Mégse
        </button>
        <button
          class="btn btn--primary"
          [disabled]="selectedLayerCount() === 0 || isRestoring()"
          (click)="restoreSelected()"
        >
          @if (isRestoring()) {
            <lucide-icon [name]="ICONS.LOADER" [size]="16" class="spin" />
            Visszaállítás...
          } @else if (selectedLayerCount() === totalLayerCount()) {
            <lucide-icon [name]="ICONS.UNDO" [size]="16" />
            Mindent visszaállít
          } @else {
            <lucide-icon [name]="ICONS.UNDO" [size]="16" />
            Kiválasztottak visszaállítása
          }
        </button>
      </div>
    </app-dialog-wrapper>
  `,
  styles: `
    .restore-tree {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .restore-tree__node {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;

      &:hover {
        background: var(--bg-hover, rgba(0,0,0,0.04));
      }

      &--child {
        padding-left: 36px;
      }

      input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: var(--color-primary, #7c3aed);
        cursor: pointer;
      }
    }

    .restore-tree__name {
      font-weight: 500;
      font-size: 14px;
      flex: 1;
    }

    .restore-tree__count {
      font-size: 12px;
      color: var(--text-tertiary, #9ca3af);
    }

    .restore-summary {
      margin-top: 12px;
      padding: 8px 12px;
      background: var(--bg-subtle, #f9fafb);
      border-radius: 8px;
      font-size: 13px;
      color: var(--text-secondary, #6b7280);
      text-align: center;
    }
  `,
})
export class SnapshotRestoreDialogComponent {
  readonly layers = input.required<SnapshotLayer[]>();
  readonly isRestoring = input(false);
  readonly closeEvent = output<void>();
  readonly restoreEvent = output<string[][]>();
  protected readonly ICONS = ICONS;

  /**
   * Checked state: Set<string> — path key-eket tárol ("Images", "Images/Students", "")
   * Signal-ként kezeljük, hogy az OnPush változásdetektálás működjön.
   */
  readonly checkedKeys = signal<Set<string>>(new Set());

  /** Init: layers input változásakor reset checked (mind be) */
  constructor() {
    effect(() => {
      const tree = this.groupTree();
      const keys = new Set<string>();
      for (const node of tree) {
        keys.add(this.pathKey(node.path));
        for (const child of node.children) {
          keys.add(this.pathKey(child.path));
        }
      }
      if (this.rootLayerCount() > 0) {
        keys.add('');
      }
      this.checkedKeys.set(keys);
    });
  }

  /** Fa struktúra a csoportokból */
  readonly groupTree = computed(() => {
    const layers = this.layers();
    const nodeMap = new Map<string, GroupNode>();

    for (const layer of layers) {
      if (layer.groupPath.length === 0) continue;

      const topName = layer.groupPath[0];
      if (!nodeMap.has(topName)) {
        nodeMap.set(topName, { name: topName, path: [topName], layerCount: 0, children: [] });
      }
      const topNode = nodeMap.get(topName)!;
      topNode.layerCount++;

      if (layer.groupPath.length >= 2) {
        const childName = layer.groupPath[1];
        let child = topNode.children.find(c => c.name === childName);
        if (!child) {
          child = { name: childName, path: [topName, childName], layerCount: 0, children: [] };
          topNode.children.push(child);
        }
        child.layerCount++;
      }
    }

    return Array.from(nodeMap.values());
  });

  readonly rootLayerCount = computed(() =>
    this.layers().filter(l => l.groupPath.length === 0).length
  );

  readonly totalLayerCount = computed(() => this.layers().length);

  readonly selectedLayerCount = computed(() => {
    const keys = this.checkedKeys();
    const tree = this.groupTree();
    let count = 0;

    for (const node of tree) {
      const topKey = this.pathKey(node.path);
      if (keys.has(topKey)) {
        count += node.layerCount;
      } else {
        for (const child of node.children) {
          if (keys.has(this.pathKey(child.path))) count += child.layerCount;
        }
      }
    }

    if (keys.has('')) count += this.rootLayerCount();
    return count;
  });

  isChecked(path: string[]): boolean {
    return this.checkedKeys().has(this.pathKey(path));
  }

  toggleNode(node: GroupNode): void {
    const keys = new Set(this.checkedKeys());
    const key = this.pathKey(node.path);

    if (keys.has(key)) {
      keys.delete(key);
      // Felső szintű csoport: children is ki
      if (node.path.length === 1) {
        for (const child of node.children) {
          keys.delete(this.pathKey(child.path));
        }
      }
    } else {
      keys.add(key);
      // Felső szintű csoport: children is be
      if (node.path.length === 1) {
        for (const child of node.children) {
          keys.add(this.pathKey(child.path));
        }
      }
    }

    this.checkedKeys.set(keys);
  }

  toggleRoot(): void {
    const keys = new Set(this.checkedKeys());
    if (keys.has('')) {
      keys.delete('');
    } else {
      keys.add('');
    }
    this.checkedKeys.set(keys);
  }

  restoreSelected(): void {
    const keys = this.checkedKeys();
    const selectedGroups: string[][] = [];
    const tree = this.groupTree();

    for (const node of tree) {
      const topKey = this.pathKey(node.path);
      if (keys.has(topKey)) {
        selectedGroups.push(node.path);
      } else {
        for (const child of node.children) {
          if (keys.has(this.pathKey(child.path))) selectedGroups.push(child.path);
        }
      }
    }

    if (keys.has('')) selectedGroups.push([]);

    this.restoreEvent.emit(selectedGroups);
  }

  private pathKey(path: string[]): string {
    return path.join('/');
  }
}
