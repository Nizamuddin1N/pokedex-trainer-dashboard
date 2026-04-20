import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { TrainerStore } from './state/trainer.store';
import { TrainerSelectors } from './state/trainer.selectors';
import { LocalApiService } from './graphql/local-api.service';
import { of } from 'rxjs';

/**
 * Unit tests for the AppComponent (application shell).
 * Mocks the LocalApiService to prevent real HTTP calls during testing.
 */
describe('AppComponent', () => {
  beforeEach(async () => {
    const localApiSpy = jasmine.createSpyObj('LocalApiService', [
      'fetchTrainers', 'fetchTeams', 'fetchBattles', 'fetchBattleLog',
    ]);
    localApiSpy.fetchTrainers.and.returnValue(of([]));
    localApiSpy.fetchTeams.and.returnValue(of([]));
    localApiSpy.fetchBattles.and.returnValue(of([]));
    localApiSpy.fetchBattleLog.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: LocalApiService, useValue: localApiSpy },
      ],
    }).compileComponents();
  });

  /**
   * Verifies that the AppComponent creates successfully with mocked services.
   */
  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  /**
   * Verifies that the sidebar starts in the expanded state.
   */
  it('should start with sidebar expanded', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.sidebarCollapsed()).toBeFalse();
  });
});
