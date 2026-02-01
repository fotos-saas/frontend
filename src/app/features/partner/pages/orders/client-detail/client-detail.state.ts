import { signal, computed } from '@angular/core';
import { DialogStateHelper } from '../../../../../shared/helpers/dialog-state.helper';
import { PartnerClientDetails, AlbumStatus } from '../../../services/partner-orders.service';

/**
 * Client Detail State
 *
 * Csoportosított state a client-detail komponenshez.
 * Az AlbumDetailState mintára épül - Signal-based state management.
 */
export class ClientDetailState {
  // === CLIENT STATE ===

  /** Betöltés folyamatban */
  readonly loading = signal<boolean>(true);

  /** Kliens adatok */
  readonly client = signal<PartnerClientDetails | null>(null);

  // === ACTION FLAGS ===

  /** Mentés folyamatban */
  readonly saving = signal<boolean>(false);

  /** Kód generálás folyamatban */
  readonly generatingCode = signal<boolean>(false);

  /** Kód lejárat módosítás folyamatban */
  readonly extendingCode = signal<boolean>(false);

  /** Album lejárat módosítás - melyik albumé */
  readonly extendingAlbumId = signal<number | null>(null);

  /** Album státusz váltás - melyik albumé */
  readonly togglingAlbumId = signal<number | null>(null);

  /** Album letöltés toggle - melyik albumé */
  readonly togglingDownloadId = signal<number | null>(null);

  // === DIALOGS (DialogStateHelper használat) ===

  /** Kliens szerkesztés dialógus */
  readonly editDialog = new DialogStateHelper();

  /** Album létrehozás dialógus */
  readonly albumDialog = new DialogStateHelper();

  /** Kliens törlés confirm dialógus */
  readonly deleteDialog = new DialogStateHelper();

  /** Kód inaktiválás confirm dialógus */
  readonly disableCodeDialog = new DialogStateHelper();

  /** Album újranyitás confirm dialógus */
  readonly reopenDialog = new DialogStateHelper();

  /** Újranyitandó album */
  readonly albumToReopen = signal<{ id: number; name: string } | null>(null);

  // === EDIT FORM DATA ===

  /** Szerkesztés form adatai */
  editForm = {
    name: '',
    email: '',
    phone: '',
    note: '',
    allowRegistration: false
  };

  /** Album létrehozás form */
  albumForm = {
    name: '',
    type: 'selection' as 'selection' | 'tablo',
    min_selections: null as number | null,
    max_selections: null as number | null,
    max_retouch_photos: 5 as number | null
  };

  // === COMPUTED VALUES ===

  /** Van-e aktív belépési kód */
  readonly hasActiveCode = computed<boolean>(() => {
    const c = this.client();
    return !!(c?.accessCodeEnabled && c?.accessCode);
  });

  /** Kód lejárt-e */
  readonly isCodeExpired = computed<boolean>(() => {
    const expiresAt = this.client()?.accessCodeExpiresAt;
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  });

  /** Kliens regisztrált-e */
  readonly isRegistered = computed<boolean>(() =>
    this.client()?.isRegistered ?? false
  );

  /** Albumok száma */
  readonly albumsCount = computed<number>(() =>
    this.client()?.albums.length ?? 0
  );

  /** Van-e album */
  readonly hasAlbums = computed<boolean>(() =>
    this.albumsCount() > 0
  );

  // === METHODS ===

  /**
   * Betöltés befejezése
   */
  finishLoading(loadedClient: PartnerClientDetails): void {
    this.client.set(loadedClient);
    this.loading.set(false);
  }

  /**
   * Betöltés indítása
   */
  startLoading(): void {
    this.loading.set(true);
  }

  /**
   * Betöltési hiba
   */
  loadingError(): void {
    this.loading.set(false);
  }

  /**
   * Szerkesztés modal megnyitása
   */
  openEditModal(): void {
    const c = this.client();
    if (!c) return;

    this.editForm = {
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      note: c.note || '',
      allowRegistration: c.allowRegistration ?? false
    };
    this.editDialog.open();
  }

  /**
   * Szerkesztés modal bezárása
   */
  closeEditModal(): void {
    this.editDialog.close();
  }

  /**
   * Kliens szerkesztés sikeres
   */
  updateClientSuccess(updatedData: Partial<PartnerClientDetails>): void {
    const c = this.client();
    if (!c) return;

    this.client.set({ ...c, ...updatedData });
    this.editDialog.submitSuccess();
    this.saving.set(false);
  }

  /**
   * Album modal megnyitása
   */
  openAlbumModal(): void {
    this.albumForm = {
      name: '',
      type: 'selection',
      min_selections: null,
      max_selections: null,
      max_retouch_photos: 5
    };
    this.albumDialog.open();
  }

  /**
   * Album modal bezárása
   */
  closeAlbumModal(): void {
    this.albumDialog.close();
  }

  /**
   * Kód generálás sikeres
   */
  codeGenerated(code: string, expiresAt: string | null): void {
    const c = this.client();
    if (!c) return;

    this.client.set({
      ...c,
      accessCode: code,
      accessCodeEnabled: true,
      accessCodeExpiresAt: expiresAt
    });
    this.generatingCode.set(false);
  }

  /**
   * Kód lejárat frissítése
   */
  updateCodeExpiry(expiresAt: string | null): void {
    const c = this.client();
    if (!c) return;

    this.client.set({ ...c, accessCodeExpiresAt: expiresAt });
    this.extendingCode.set(false);
  }

  /**
   * Kód inaktiválás sikeres
   */
  codeDisabled(): void {
    const c = this.client();
    if (!c) return;

    this.client.set({ ...c, accessCodeEnabled: false });
    this.disableCodeDialog.close();
  }

  /**
   * Album státusz frissítése
   */
  updateAlbumStatus(albumId: number, status: AlbumStatus): void {
    const c = this.client();
    if (!c) return;

    const updatedAlbums = c.albums.map(a =>
      a.id === albumId ? { ...a, status } : a
    );
    this.client.set({ ...c, albums: updatedAlbums });
    this.togglingAlbumId.set(null);
  }

  /**
   * Album lejárat frissítése
   */
  updateAlbumExpiry(albumId: number, expiresAt: string | null): void {
    const c = this.client();
    if (!c) return;

    const updatedAlbums = c.albums.map(a =>
      a.id === albumId ? { ...a, expiresAt } : a
    );
    this.client.set({ ...c, albums: updatedAlbums });
    this.extendingAlbumId.set(null);
  }

  /**
   * Album letöltés engedélyezés frissítése
   */
  updateAlbumDownload(albumId: number, allowDownload: boolean): void {
    const c = this.client();
    if (!c) return;

    const updatedAlbums = c.albums.map(a =>
      a.id === albumId ? { ...a, allowDownload } : a
    );
    this.client.set({ ...c, albums: updatedAlbums });
    this.togglingDownloadId.set(null);
  }

  /**
   * Album újranyitás confirm megnyitása
   */
  confirmReopen(album: { id: number; name: string }): void {
    this.albumToReopen.set(album);
    this.reopenDialog.open();
  }

  /**
   * Album újranyitás confirm bezárása
   */
  closeReopenConfirm(): void {
    this.reopenDialog.close();
    this.albumToReopen.set(null);
  }

  /**
   * Lejárat dátum value formázás
   */
  getExpiryDateValue(): string {
    const expiresAt = this.client()?.accessCodeExpiresAt;
    if (!expiresAt) return '';
    return new Date(expiresAt).toISOString().split('T')[0];
  }

  /**
   * Holnapi dátum (minimum lejárathoz)
   */
  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  /**
   * Album lejárt-e
   */
  isAlbumExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  /**
   * Album lejárat formázás
   */
  formatExpiryDate(expiresAt: string | null): string {
    if (!expiresAt) return '';
    const date = new Date(expiresAt);
    return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.loading.set(true);
    this.client.set(null);
    this.saving.set(false);
    this.generatingCode.set(false);
    this.extendingCode.set(false);
    this.extendingAlbumId.set(null);
    this.togglingAlbumId.set(null);
    this.togglingDownloadId.set(null);
    this.editDialog.reset();
    this.albumDialog.reset();
    this.deleteDialog.reset();
    this.disableCodeDialog.reset();
    this.reopenDialog.reset();
    this.albumToReopen.set(null);
  }
}
