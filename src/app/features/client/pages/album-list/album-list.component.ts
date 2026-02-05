import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { AlbumListStateService } from './album-list-state.service';

/**
 * Client Album List - Albumok listája az ügyfél számára
 */
@Component({
  selector: 'app-client-album-list',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  providers: [AlbumListStateService],
  templateUrl: './album-list.component.html',
  styleUrl: './album-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientAlbumListComponent implements OnInit {
  private readonly state = inject(AlbumListStateService);
  protected readonly ICONS = ICONS;

  /** Signal delegálások a template számára */
  readonly albums = this.state.albums;
  readonly loading = this.state.loading;
  readonly error = this.state.error;

  ngOnInit(): void {
    this.state.loadAlbums();
  }

  loadAlbums(): void {
    this.state.loadAlbums();
  }
}
