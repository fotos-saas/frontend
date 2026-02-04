import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { SentryService } from './app/core/services/sentry.service';

// Sentry inicializalasa a leheto legkorabban (modultol fuggetlenul)
const sentryService = new SentryService();
sentryService.init();

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => {
    // Hiba kuldes Sentry-nek bootstrap hiba eseten
    sentryService.captureException(err, { context: 'bootstrap' });
    console.error(err);
  });
