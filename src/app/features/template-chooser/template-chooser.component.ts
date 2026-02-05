import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LightboxComponent } from './components/lightbox/lightbox.component';
import { TemplateChooserFacadeService } from './template-chooser-facade.service';

/**
 * Template Chooser Component - Minta Valaszto oldal
 *
 * Marketplace-stilusu template bongeszoe:
 * - Kategoria szures (chips)
 * - Kereses
 * - Grid elrendezes
 * - Lightbox elonezet (child komponens)
 * - Load more pagination
 * - Auto-save kivalasztas
 *
 * Az uzleti logika a TemplateChooserFacadeService-ben van.
 */
@Component({
  selector: 'app-template-chooser',
  standalone: true,
  imports: [FormsModule, LightboxComponent],
  providers: [TemplateChooserFacadeService],
  templateUrl: './template-chooser.component.html',
  styleUrls: ['./template-chooser.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateChooserComponent implements OnInit {
  readonly facade = inject(TemplateChooserFacadeService);

  ngOnInit(): void {
    this.facade.init();
  }
}
