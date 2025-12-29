import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { A11yModule } from '@angular/cdk/a11y';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // enable Angular animations for the application and CDK A11y (focus-trap)
    importProvidersFrom(BrowserAnimationsModule, A11yModule)
  ]
};
