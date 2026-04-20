import { ApplicationConfig, provideZoneChangeDetection, inject } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideApollo, provideNamedApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache } from '@apollo/client/core';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';

/**
 * Root application configuration.
 * Provides routing, HTTP client, Apollo GraphQL (default + named clients),
 * Chart.js, and animations.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(),
    provideAnimations(),
    provideCharts(withDefaultRegisterables()),
    provideApollo(() => {
      const httpLink = inject(HttpLink);
      return {
        link: httpLink.create({ uri: 'https://beta.pokeapi.co/graphql/v1beta' }),
        cache: new InMemoryCache(),
      };
    }),
    provideNamedApollo(() => {
      const httpLink = inject(HttpLink);
      return {
        local: {
          link: httpLink.create({ uri: 'http://localhost:4000/' }),
          cache: new InMemoryCache(),
        },
      };
    }),
  ],
};
