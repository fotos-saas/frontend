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
  templateUrl: './snapshot-restore-dialog.component.html',
  styleUrl: './snapshot-restore-dialog.component.scss',
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
