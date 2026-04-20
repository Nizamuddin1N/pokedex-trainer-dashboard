import { PokemonSpritePipe } from './pokemon-sprite.pipe';

/**
 * Unit tests for PokemonSpritePipe.
 * Tests sprite URL generation for different variants and edge cases.
 */
describe('PokemonSpritePipe', () => {
  let pipe: PokemonSpritePipe;

  beforeEach(() => {
    pipe = new PokemonSpritePipe();
  });

  /**
   * Verifies default sprite URL generation.
   */
  it('should transform a valid ID to the default sprite URL', () => {
    const result = pipe.transform(25);
    expect(result).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png');
  });

  /**
   * Verifies shiny variant sprite URL generation.
   */
  it('should generate shiny sprite URL', () => {
    const result = pipe.transform(25, 'shiny');
    expect(result).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png');
  });

  /**
   * Verifies official artwork variant URL generation.
   */
  it('should generate artwork URL', () => {
    const result = pipe.transform(25, 'artwork');
    expect(result).toBe('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png');
  });

  /**
   * Verifies fallback for null/undefined/invalid IDs.
   */
  it('should return placeholder for null or invalid ID', () => {
    const result = pipe.transform(null);
    expect(result).toContain('data:image/svg+xml');
  });

  /**
   * Verifies fallback for zero ID.
   */
  it('should return placeholder for zero ID', () => {
    const result = pipe.transform(0);
    expect(result).toContain('data:image/svg+xml');
  });
});
