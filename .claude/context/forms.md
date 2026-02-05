# 📝 Forms Context

> Töltsd be ezt ha űrlapokkal dolgozol.

## Reactive Form Sablon

```typescript
@Component({
  imports: [ReactiveFormsModule, MatInputModule, MatFormFieldModule],
})
export class MyFormComponent implements OnInit {
  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[0-9]{10,14}$/)]],
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = this.form.value;
    // submit...
  }

  // Helper a template-hez
  get nameError(): string | null {
    const control = this.form.get('name');
    if (control?.hasError('required')) return 'Név megadása kötelező';
    if (control?.hasError('minlength')) return 'Minimum 3 karakter';
    return null;
  }
}
```

## Template

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <mat-form-field>
    <mat-label>Név</mat-label>
    <input matInput formControlName="name">
    @if (nameError && form.get('name')?.touched) {
      <mat-error>{{ nameError }}</mat-error>
    }
  </mat-form-field>

  <button mat-raised-button color="primary"
          [disabled]="form.invalid || loading()">
    Mentés
  </button>
</form>
```

## Validátorok

```typescript
// Beépített
Validators.required
Validators.email
Validators.minLength(3)
Validators.maxLength(100)
Validators.pattern(/regex/)

// Custom validator
function passwordMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');

  if (password?.value !== confirm?.value) {
    return { passwordMismatch: true };
  }
  return null;
}

// Használat
this.fb.group({
  password: ['', Validators.required],
  confirmPassword: ['', Validators.required],
}, { validators: passwordMatch });
```

## Async Validator

```typescript
function uniqueEmail(apiService: ApiService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    return apiService.checkEmail(control.value).pipe(
      map(exists => exists ? { emailTaken: true } : null),
      catchError(() => of(null))
    );
  };
}

// Használat
email: ['', [Validators.required, Validators.email], [uniqueEmail(this.apiService)]]
```

## Form Array

```typescript
// Dinamikus mezők
form = this.fb.group({
  items: this.fb.array([])
});

get items(): FormArray {
  return this.form.get('items') as FormArray;
}

addItem() {
  this.items.push(this.fb.group({
    name: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]]
  }));
}

removeItem(index: number) {
  this.items.removeAt(index);
}
```

```html
<div formArrayName="items">
  @for (item of items.controls; track $index) {
    <div [formGroupName]="$index">
      <input formControlName="name">
      <input type="number" formControlName="quantity">
      <button (click)="removeItem($index)">Törlés</button>
    </div>
  }
</div>
<button (click)="addItem()">Új elem</button>
```

## Magyar Hibaüzenetek

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  required: 'Kötelező mező',
  email: 'Érvénytelen email cím',
  minlength: 'Túl rövid',
  maxlength: 'Túl hosszú',
  pattern: 'Érvénytelen formátum',
  emailTaken: 'Ez az email már foglalt',
  passwordMismatch: 'A jelszavak nem egyeznek',
};
```

## Submit Pattern

```typescript
async onSubmit() {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  this.loading.set(true);

  try {
    await firstValueFrom(this.apiService.submit(this.form.value));
    this.notificationService.success('Sikeresen mentve');
    this.form.reset();
  } catch (error) {
    this.notificationService.error('Hiba történt');
  } finally {
    this.loading.set(false);
  }
}
```

