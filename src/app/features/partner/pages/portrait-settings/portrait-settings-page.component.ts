import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PortraitSettingsComponent } from '@shared/components/portrait-settings';

@Component({
  selector: 'app-portrait-settings-page',
  standalone: true,
  imports: [PortraitSettingsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="portrait-settings-page page-card page-card--narrow">
      <app-portrait-settings />
    </div>
  `,
})
export class PortraitSettingsPageComponent {}
