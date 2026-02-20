import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeHu from '@angular/common/locales/hu';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

registerLocaleData(localeHu, 'hu-HU');
registerLocaleData(localeHu, 'hu');

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
