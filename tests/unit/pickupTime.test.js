import { expect, it } from 'vitest';
import { chisinauInstant } from '../../src/domain/features/pickup/chisinauTime.js';
import { pickupLabel } from '../../src/shared/lib/format.js';
it('interprets pickup hours in Moldova regardless of the browser timezone and DST', () => {
  expect(chisinauInstant('2027-01-15', 10)).toBe('2027-01-15T08:00:00.000Z');
  expect(chisinauInstant('2027-07-15', 10)).toBe('2027-07-15T07:00:00.000Z');
});

it('shows the point time zone and both dates when an interval crosses local midnight', () => {
  const label = pickupLabel({
    startsAt: '2027-07-15T20:30:00.000Z',
    endsAt: '2027-07-15T21:30:00.000Z',
    timeZone: 'Europe/Chisinau',
    location: 'Piața centrală',
  });
  expect(label).toMatch(/15.*23:30.*16.*00:30.*Europe\/Chisinau/);
});

it('shows the local clocks on either side of the seasonal time change', () => {
  const label = pickupLabel({
    startsAt: '2027-03-28T00:30:00.000Z',
    endsAt: '2027-03-28T01:30:00.000Z',
    timeZone: 'Europe/Chisinau',
    location: 'Piața centrală',
  });
  expect(label).toContain('02:30–04:30 (Europe/Chisinau)');
});
