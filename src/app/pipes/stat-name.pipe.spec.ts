import { StatNamePipe } from './stat-name.pipe';

/**
 * Unit tests for StatNamePipe.
 * Tests stat name transformation for all 6 base stats.
 */
describe('StatNamePipe', () => {
  let pipe: StatNamePipe;

  beforeEach(() => {
    pipe = new StatNamePipe();
  });

  /**
   * Verifies HP stat name transformation.
   */
  it('should transform "hp" to "HP"', () => {
    expect(pipe.transform('hp')).toBe('HP');
  });

  /**
   * Verifies attack stat name transformation.
   */
  it('should transform "attack" to "Attack"', () => {
    expect(pipe.transform('attack')).toBe('Attack');
  });

  /**
   * Verifies special-attack stat name transformation.
   */
  it('should transform "special-attack" to "Sp. Atk"', () => {
    expect(pipe.transform('special-attack')).toBe('Sp. Atk');
  });

  /**
   * Verifies special-defense stat name transformation.
   */
  it('should transform "special-defense" to "Sp. Def"', () => {
    expect(pipe.transform('special-defense')).toBe('Sp. Def');
  });

  /**
   * Verifies unknown stat name passthrough.
   */
  it('should return the original value for unknown stats', () => {
    expect(pipe.transform('unknown-stat')).toBe('unknown-stat');
  });
});
