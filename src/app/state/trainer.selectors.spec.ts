import { TestBed } from '@angular/core/testing';
import { TrainerSelectors } from './trainer.selectors';
import { TrainerStore } from './trainer.store';
import { LocalApiService } from '../graphql/local-api.service';
import { of } from 'rxjs';
import { Battle } from '../models/trainer.model';

/**
 * Unit tests for TrainerSelectors.
 * Tests derived observable selectors for win rate,
 * battle stats, and monthly breakdowns.
 */
describe('TrainerSelectors', () => {
  let selectors: TrainerSelectors;
  let store: TrainerStore;

  const mockBattles: Battle[] = [
    { id: 1, trainer_id: 1, opponent_name: 'Gary', team_id: 1, result: 'win', date: '2024-06-01', score_trainer: 3, score_opponent: 1 },
    { id: 2, trainer_id: 1, opponent_name: 'Cynthia', team_id: 1, result: 'loss', date: '2024-06-15', score_trainer: 1, score_opponent: 3 },
    { id: 3, trainer_id: 1, opponent_name: 'Lance', team_id: 1, result: 'win', date: '2024-07-01', score_trainer: 3, score_opponent: 2 },
    { id: 4, trainer_id: 2, opponent_name: 'Lorelei', team_id: 3, result: 'win', date: '2024-07-10', score_trainer: 3, score_opponent: 0 },
  ];

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('LocalApiService', [
      'fetchTrainers', 'fetchTeams', 'fetchBattles', 'fetchBattleLog',
    ]);
    apiSpy.fetchTrainers.and.returnValue(of([]));
    apiSpy.fetchTeams.and.returnValue(of([]));
    apiSpy.fetchBattles.and.returnValue(of([]));
    apiSpy.fetchBattleLog.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        TrainerStore,
        TrainerSelectors,
        { provide: LocalApiService, useValue: apiSpy },
      ],
    });

    store = TestBed.inject(TrainerStore);
    selectors = TestBed.inject(TrainerSelectors);

    // Manually set battles in store state
    (store as any)._state$.next({
      ...store.state,
      currentTrainerId: 1,
      trainers: [{ id: 1, name: 'Ash', badge_count: 8, region: 'Kanto', avatar_url: '', rank: 'Champion' }],
      battles: mockBattles,
    });
  });

  /**
   * Verifies win rate calculation returns correct percentage.
   * Trainer 1 has 2 wins out of 3 battles = 67%.
   */
  it('should compute correct win rate for current trainer', (done) => {
    selectors.winRate$.subscribe(rate => {
      expect(rate).toBe(67);
      done();
    });
  });

  /**
   * Verifies battle stats counts wins/losses correctly.
   */
  it('should compute correct battle stats', (done) => {
    selectors.battleStats$.subscribe(stats => {
      expect(stats.wins).toBe(2);
      expect(stats.losses).toBe(1);
      expect(stats.total).toBe(3);
      done();
    });
  });

  /**
   * Verifies monthly breakdown groups battles correctly.
   */
  it('should compute monthly battle breakdown', (done) => {
    selectors.monthlyBattles$.subscribe(data => {
      expect(data.length).toBe(2); // June and July
      const june = data.find(d => d.month.includes('Jun'));
      expect(june?.wins).toBe(1);
      expect(june?.losses).toBe(1);
      done();
    });
  });
});
