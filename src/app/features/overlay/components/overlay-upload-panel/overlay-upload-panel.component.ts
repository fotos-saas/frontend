import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { OverlayUploadPanelService } from '../../overlay-upload-panel.service';
import { OverlayProjectService, PersonItem } from '../../overlay-project.service';

@Component({
  selector: 'app-overlay-upload-panel',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './overlay-upload-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayUploadPanelComponent {
  protected readonly ICONS = ICONS;
  readonly uploadPanel = inject(OverlayUploadPanelService);
  readonly projectService = inject(OverlayProjectService);

  readonly openLinkDialog = output<PersonItem>();
  readonly openPhotoChooser = output<PersonItem>();
}
