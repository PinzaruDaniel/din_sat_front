import { expect, it } from 'vitest';
import { chisinauInstant } from '../../src/domain/features/pickup/chisinauTime.js';
it('interprets pickup hours in Moldova regardless of the browser timezone and DST', () => {
  expect(chisinauInstant('2027-01-15', 10)).toBe('2027-01-15T08:00:00.000Z');
  expect(chisinauInstant('2027-07-15', 10)).toBe('2027-07-15T07:00:00.000Z');
});
