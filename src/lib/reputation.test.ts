import { test, expect, describe } from 'vitest';
import { detectClusters } from './reputation';

describe('detectClusters', () => {
  test('catches a ring of 3 accounts', () => {
    const ratings = [
      { id: 'r1', raterId: 'A', subjectId: 'B', stars: 5 },
      { id: 'r2', raterId: 'B', subjectId: 'C', stars: 5 },
      { id: 'r3', raterId: 'C', subjectId: 'A', stars: 5 },
    ];
    const clusters = detectClusters(ratings);
    expect(clusters.size).toBe(3);
    expect(clusters.get('r1')).toMatch(/^cluster-/);
    expect(clusters.get('r2')).toEqual(clusters.get('r1'));
    expect(clusters.get('r3')).toEqual(clusters.get('r1'));
  });

  test('does not catch a legitimate dense community (low internal edge share)', () => {
    const ratings = [
      { id: 'r1', raterId: 'A', subjectId: 'B', stars: 5 },
      { id: 'r2', raterId: 'B', subjectId: 'C', stars: 5 },
      { id: 'r3', raterId: 'C', subjectId: 'A', stars: 5 },
      { id: 'o1', raterId: 'A', subjectId: 'D', stars: 5 },
      { id: 'o2', raterId: 'A', subjectId: 'E', stars: 5 },
      { id: 'o3', raterId: 'B', subjectId: 'F', stars: 5 },
      { id: 'o4', raterId: 'B', subjectId: 'G', stars: 5 },
      { id: 'o5', raterId: 'C', subjectId: 'H', stars: 5 },
      { id: 'o6', raterId: 'C', subjectId: 'I', stars: 5 },
    ];
    const clusters = detectClusters(ratings);
    expect(clusters.size).toBe(0);
  });
  
  test('catches a farm with one hub account', () => {
    const ratings = [
      { id: 'r1', raterId: 'Hub', subjectId: 'F1', stars: 5 },
      { id: 'r2', raterId: 'F1', subjectId: 'Hub', stars: 5 },
      { id: 'r3', raterId: 'Hub', subjectId: 'F2', stars: 5 },
      { id: 'r4', raterId: 'F2', subjectId: 'Hub', stars: 5 },
      { id: 'r5', raterId: 'Hub', subjectId: 'F3', stars: 5 },
      { id: 'r6', raterId: 'F3', subjectId: 'Hub', stars: 5 },
    ];
    const clusters = detectClusters(ratings);
    expect(clusters.size).toBe(6);
  });
});
