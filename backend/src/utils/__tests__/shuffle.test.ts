import { shuffle } from '../shuffle';

describe('shuffle', () => {
  it('should return an array with the same length', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle([...input]);
    expect(result.length).toBe(input.length);
  });

  it('should contain all original elements', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle([...input]);
    expect(result.sort()).toEqual(input.sort());
  });

  it('should handle empty array', () => {
    const input: number[] = [];
    const result = shuffle([...input]);
    expect(result).toEqual([]);
  });

  it('should handle single element array', () => {
    const input = [42];
    const result = shuffle([...input]);
    expect(result).toEqual([42]);
  });

  it('should handle two element array', () => {
    const input = [1, 2];
    const result = shuffle([...input]);
    expect(result.length).toBe(2);
    expect(result).toContain(1);
    expect(result).toContain(2);
  });

  it('should modify array in place', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result).toBe(input); // Same reference
  });

  it('should work with different data types', () => {
    const input = ['a', 'b', 'c', 'd'];
    const result = shuffle([...input]);
    expect(result.length).toBe(input.length);
    expect(result.sort()).toEqual(input.sort());
  });

  it('should produce different results on multiple runs (probabilistic)', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const results = new Set<string>();
    
    // Run shuffle 10 times and collect results
    for (let i = 0; i < 10; i++) {
      const shuffled = shuffle([...input]);
      results.add(JSON.stringify(shuffled));
    }
    
    // With 10 elements, we should get different orderings
    // (not guaranteed but extremely likely)
    expect(results.size).toBeGreaterThan(1);
  });
});
