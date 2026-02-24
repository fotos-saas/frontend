import {
  Component, ChangeDetectionStrategy, signal, computed,
  OnInit, inject, DestroyRef,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { environment } from '../../../environments/environment';

interface PersonItem {
  id: number;
  name: string;
  type: 'student' | 'teacher';
  hasPhoto: boolean;
  photoThumbUrl: string | null;
}

interface UploadResult {
  success: boolean;
  message?: string;
  photo?: { thumbUrl: string };
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

@Component({
  selector: 'app-photo-upload-dialog',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './photo-upload-dialog.component.html',
  styleUrl: './photo-upload-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoUploadDialogComponent implements OnInit {
  protected readonly ICONS = ICONS;
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly projectId = signal(0);
  readonly persons = signal<PersonItem[]>([]);
  readonly selectedPerson = signal<PersonItem | null>(null);
  readonly searchQuery = signal('');
  readonly uploading = signal(false);
  readonly uploadResult = signal<UploadResult | null>(null);
  readonly dragOver = signal(false);
  readonly loading = signal(false);
  readonly selectedFile = signal<File | null>(null);

  readonly filteredPersons = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.persons();
    if (!q) return list;
    return list.filter(p => p.name.toLowerCase().includes(q));
  });

  readonly canUpload = computed(() =>
    !!this.selectedPerson() && !!this.selectedFile() && !this.uploading()
  );

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);
    const pid = parseInt(params.get('projectId') || '0', 10);
    this.projectId.set(pid);
    if (pid > 0) {
      this.loadPersons(pid);
    }
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  selectPerson(person: PersonItem): void {
    this.selectedPerson.set(person);
    this.uploadResult.set(null);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.setFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.setFile(files[0]);
    }
  }

  upload(): void {
    const person = this.selectedPerson();
    const file = this.selectedFile();
    const pid = this.projectId();
    if (!person || !file || !pid) return;

    this.uploading.set(true);
    this.uploadResult.set(null);

    const formData = new FormData();
    formData.append('photo', file);

    const url = `${environment.apiUrl}/partner/projects/${pid}/persons/${person.id}/photo`;

    this.http.post<UploadResult>(url, formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.uploading.set(false);
          this.uploadResult.set(res);
          this.selectedFile.set(null);
          if (res.success) {
            this.persons.update(list =>
              list.map(p => p.id === person.id
                ? { ...p, hasPhoto: true, photoThumbUrl: res.photo?.thumbUrl ?? p.photoThumbUrl }
                : p
              )
            );
          }
        },
        error: (err) => {
          this.uploading.set(false);
          this.uploadResult.set({
            success: false,
            message: err.error?.message || 'Hiba tortent a feltoltes soran.',
          });
        },
      });
  }

  close(): void {
    window.electronAPI?.photoUpload.close();
  }

  private setFile(file: File): void {
    if (!ALLOWED_TYPES.includes(file.type)) {
      this.uploadResult.set({ success: false, message: 'Csak kepfajlok engedelyezettek (JPG, PNG, WebP, HEIC).' });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      this.uploadResult.set({ success: false, message: `A fajl tul nagy (max 100 MB, jelenlegi: ${(file.size / 1024 / 1024).toFixed(1)} MB).` });
      return;
    }
    this.selectedFile.set(file);
    this.uploadResult.set(null);
  }

  private loadPersons(projectId: number): void {
    this.loading.set(true);
    const url = `${environment.apiUrl}/partner/projects/${projectId}/persons`;

    this.http.get<{ data: PersonItem[] }>(url)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.persons.set(res.data || []);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }
}
