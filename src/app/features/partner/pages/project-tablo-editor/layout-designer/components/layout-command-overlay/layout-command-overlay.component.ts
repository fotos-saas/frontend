import {
  Component, ChangeDetectionStrategy, signal, output, computed,
  HostListener,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { COMMAND_SECTIONS, CommandSection } from './layout-command-overlay.data';

/**
 * Floating Command Overlay — Claude Desktop-stílusú lebegő panel.
 * Dupla Ctrl-lel aktiválódik, always-on-top.
 * Minden tabló-szerkesztő funkció elérhető egy helyen.
 */
@Component({
  selector: 'app-layout-command-overlay',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './layout-command-overlay.component.html',
  styleUrl: './layout-command-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutCommandOverlayComponent {
  protected readonly ICONS = ICONS;

  readonly visible = signal(false);
  readonly expanded = signal(true);
  readonly minimized = signal(false);
  readonly searchQuery = signal('');

  readonly commandExecuted = output<string>();

  /** Összes szekció definíció */
  readonly sections = signal<CommandSection[]>(COMMAND_SECTIONS);

  /** Szűrt szekciók a keresés alapján */
  readonly filteredSections = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.sections();

    return this.sections()
      .map(section => ({
        ...section,
        items: section.items.filter(item =>
          item.label.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query)
        ),
      }))
      .filter(section => section.items.length > 0);
  });

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.visible()) {
      this.close();
    }
  }

  open(): void {
    this.visible.set(true);
    this.searchQuery.set('');
  }

  close(): void {
    this.visible.set(false);
  }

  toggle(): void {
    if (this.visible()) {
      this.close();
    } else {
      this.open();
    }
  }

  onCommand(commandId: string): void {
    this.commandExecuted.emit(commandId);
  }
}
