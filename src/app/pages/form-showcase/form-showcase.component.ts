import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  PsInputComponent,
  PsTextareaComponent,
  PsCheckboxComponent,
  PsToggleComponent,
  PsRadioGroupComponent,
  PsSelectComponent,
  PsSearchableSelectComponent,
  PsAutocompleteComponent,
  PsMultiSelectComponent,
  PsMultiSelectBoxComponent,
  PsTagInputComponent,
  PsEditorComponent,
  PsDatepickerComponent,
  PsTimepickerComponent,
  PsDaterangeComponent,
  PsFileUploadComponent,
  PsCodeInputComponent,
  DateRange,
  PsSelectOption,
  PsRadioOption,
  PsHelpItem,
} from '@shared/components/form';
import { ExpandableFiltersComponent } from '@shared/components/expandable-filters/expandable-filters.component';
import { FilterConfig, FilterChangeEvent } from '@shared/components/expandable-filters/expandable-filters.model';

@Component({
  selector: 'app-form-showcase',
  standalone: true,
  imports: [
    FormsModule,
    PsInputComponent,
    PsTextareaComponent,
    PsCheckboxComponent,
    PsToggleComponent,
    PsRadioGroupComponent,
    PsSelectComponent,
    PsSearchableSelectComponent,
    PsAutocompleteComponent,
    PsMultiSelectComponent,
    PsMultiSelectBoxComponent,
    PsTagInputComponent,
    PsEditorComponent,
    PsDatepickerComponent,
    PsTimepickerComponent,
    PsDaterangeComponent,
    PsFileUploadComponent,
    PsCodeInputComponent,
    ExpandableFiltersComponent,
  ],
  templateUrl: './form-showcase.component.html',
  styleUrl: './form-showcase.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormShowcaseComponent {
  // Szöveges mezők
  textValue = signal('');
  emailValue = signal('');
  passwordValue = signal('');
  numberValue = signal('');
  telValue = signal('');
  urlValue = signal('');
  dateValue = signal('');
  datepickerValue = signal('');
  datepickerMinMax = signal('');
  timeValue = signal('');
  timepickerValue = signal('');
  timepickerStep = signal('');
  dateRangeValue = signal<DateRange>({ from: '', to: '' });

  // Textarea
  textareaValue = signal('');
  textareaAutoValue = signal('');

  // Checkbox & Toggle
  checkboxValue = signal(false);
  checkboxTerms = signal(false);
  checkboxIndeterminate = signal(false);
  toggleValue = signal(false);
  toggleBefore = signal(true);

  // Radio
  radioValue = signal<string | number>('');
  radioOptions: PsRadioOption[] = [
    { value: 'light', label: 'Világos mód', sublabel: 'Fehér háttér, sötét szöveg' },
    { value: 'dark', label: 'Sötét mód', sublabel: 'Sötét háttér, világos szöveg' },
    { value: 'auto', label: 'Automatikus', sublabel: 'Rendszer beállítás követése' },
  ];

  // Select
  selectValue = signal<string | number>('');
  selectOptions: PsSelectOption[] = [
    { id: 'hu', label: 'Magyar' },
    { id: 'en', label: 'English' },
    { id: 'de', label: 'Deutsch' },
    { id: 'fr', label: 'Français', disabled: true },
  ];

  // Searchable Select
  searchableValue = signal<string | number>('');
  cityOptions: PsSelectOption[] = [
    { id: 1, label: 'Budapest', sublabel: 'Pest megye' },
    { id: 2, label: 'Debrecen', sublabel: 'Hajdú-Bihar' },
    { id: 3, label: 'Szeged', sublabel: 'Csongrád' },
    { id: 4, label: 'Miskolc', sublabel: 'Borsod' },
    { id: 5, label: 'Pécs', sublabel: 'Baranya' },
    { id: 6, label: 'Győr', sublabel: 'Győr-Moson-Sopron' },
    { id: 7, label: 'Nyíregyháza', sublabel: 'Szabolcs' },
    { id: 8, label: 'Kecskemét', sublabel: 'Bács-Kiskun' },
  ];

  // Autocomplete
  autocompleteValue = signal('');
  autoSuggestions = signal<PsSelectOption[]>([]);
  autoLoading = signal(false);

  // Multi-select
  multiSelectValue = signal<(string | number)[]>([]);
  multiSelectOptions: PsSelectOption[] = [
    { id: 'math', label: 'Matematika' },
    { id: 'physics', label: 'Fizika' },
    { id: 'chemistry', label: 'Kémia' },
    { id: 'biology', label: 'Biológia' },
    { id: 'history', label: 'Történelem' },
    { id: 'literature', label: 'Irodalom' },
  ];

  // Multi-select box
  multiBoxValue = signal<(string | number)[]>([]);

  // Tag input
  tagValues = signal<string[]>(['Angular', 'TypeScript']);

  // Code input
  codeValue = signal('');
  codeMaskedValue = signal('');

  // Rich text editor
  editorBasicValue = signal('');
  editorStandardValue = signal('');
  editorFullValue = signal('');

  // File upload
  uploadFiles = signal<File[]>([]);
  uploadCompactFiles = signal<File[]>([]);
  uploadSingleFile = signal<File[]>([]);
  uploadErrorMsg = signal('');

  // Expandable Filters demó
  filterConfigs: FilterConfig[] = [
    {
      id: 'year', label: 'Év',
      options: [
        { value: '2026', label: '2026' },
        { value: '2025', label: '2025' },
        { value: '2024', label: '2024' },
      ],
    },
    {
      id: 'status', label: 'Státusz',
      options: [
        { value: 'active', label: 'Aktív' },
        { value: 'draft', label: 'Draft' },
        { value: 'archived', label: 'Archivált' },
      ],
    },
    {
      id: 'draft_photos', label: 'Draft képek?',
      options: [
        { value: 'yes', label: 'Igen' },
        { value: 'no', label: 'Nem' },
      ],
    },
    {
      id: 'notified', label: 'Tudnak róla?',
      options: [
        { value: 'yes', label: 'Igen' },
        { value: 'no', label: 'Nem' },
      ],
    },
  ];
  filterValues = signal<Record<string, string>>({ year: '2026' });

  onFilterChange(event: FilterChangeEvent): void {
    this.filterValues.update(v => ({ ...v, [event.id]: event.value }));
  }

  // Help items demó
  searchHelpItems: PsHelpItem[] = [
    { syntax: '#123', description: 'Projekt ID keresése' },
    { syntax: '@név', description: 'Ügyintéző keresése' },
    { syntax: '"szöveg"', description: 'Pontos egyezés' },
  ];

  // Állapot demó
  stateError = signal('Ez a mező kötelező!');
  stateSuccess = signal(true);

  onUploadError(msg: string): void {
    this.uploadErrorMsg.set(msg);
    setTimeout(() => this.uploadErrorMsg.set(''), 4000);
  }

  onAutocompleteSearch(query: string): void {
    this.autoLoading.set(true);
    // Szimulált API hívás
    setTimeout(() => {
      const allNames = [
        'Kovács Anna', 'Nagy Béla', 'Szabó Csaba', 'Tóth Dóra',
        'Varga Erik', 'Kiss Fanni', 'Horváth Gábor', 'Molnár Hanna',
      ];
      this.autoSuggestions.set(
        allNames
          .filter(n => n.toLowerCase().includes(query.toLowerCase()))
          .map((n, i) => ({ id: i, label: n }))
      );
      this.autoLoading.set(false);
    }, 500);
  }
}
