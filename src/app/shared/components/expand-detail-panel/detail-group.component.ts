import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-detail-group',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './detail-group.component.html',
  styleUrl: './detail-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailGroupComponent {
  /** Csoport ikon neve (ICONS konstansból) */
  readonly icon = input.required<string>();

  /** Csoport címke */
  readonly label = input.required<string>();

  /** Opcionális darabszám a címke mellett */
  readonly count = input<number | null>(null);

  /** Opcionális darabszám egység (pl. "kép", "fájl") */
  readonly countUnit = input<string>('kép');
}
