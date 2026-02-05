# 🔌 API & HTTP Context

> Töltsd be ezt ha API hívásokkal dolgozol.

## Service Sablon

```typescript
@Injectable({ providedIn: 'root' })
export class MyApiService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getItems(): Observable<Item[]> {
    return this.http.get<ApiResponse<Item[]>>(`${this.API_URL}/items`).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  createItem(data: CreateItemDto): Observable<Item> {
    return this.http.post<ApiResponse<Item>>(`${this.API_URL}/items`, data).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => new Error(error.error?.message || 'API hiba történt'));
  }
}
```

## FormData Kezelés

```typescript
// ❌ ROSSZ - ID-k stringként mennek
const formData = new FormData();
ids.forEach(id => formData.append('ids[]', id));

// ✅ JÓ - Laravel oldalon intval
// Controller:
$ids = array_map('intval', $request->input('ids', []));
```

## File Upload

```typescript
uploadFile(file: File): Observable<UploadResult> {
  const formData = new FormData();
  formData.append('file', file, file.name);

  return this.http.post<UploadResult>(`${this.API_URL}/upload`, formData, {
    reportProgress: true,
    observe: 'events'
  }).pipe(
    filter(event => event.type === HttpEventType.Response),
    map(event => (event as HttpResponse<UploadResult>).body!)
  );
}
```

## Error Handling Pattern

```typescript
// Komponensben
this.apiService.createItem(data).pipe(
  takeUntil(this.destroy$)
).subscribe({
  next: (result) => {
    this.notificationService.success('Sikeresen létrehozva');
  },
  error: (error) => {
    this.notificationService.error(error.message);
  }
});
```

## Loading State Pattern

```typescript
@Component({...})
export class MyComponent {
  loading = signal(false);
  error = signal<string | null>(null);
  data = signal<Item[]>([]);

  loadData() {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getItems().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (items) => this.data.set(items),
      error: (err) => this.error.set(err.message)
    });
  }
}
```

## API Response Típusok

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
```

## Meglévő Service-ek - HASZNÁLD!

| Ha ezt akarod | Használd ezt |
|---------------|--------------|
| API hívások | `ApiService` |
| Auth | `AuthService` |
| File upload | `UploadService` |
| Projektek | `ProjectService` |
| Felhasználók | `UserService` |

