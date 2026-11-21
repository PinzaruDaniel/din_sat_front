// Pickup creation uses morning/afternoon hours, avoiding ambiguous DST switch hours.
// Derive the date's offset from IANA data instead of hardcoding summer/winter time.
export function chisinauInstant(date, hour) {
  const noon = new Date(`${date}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Chisinau',
    timeZoneName: 'shortOffset',
  }).formatToParts(noon);
  const offset =
    parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
  const match = /^GMT(?:([+-])(\d{1,2})(?::(\d{2}))?)?$/.exec(offset);
  const sign = match?.[1] === '-' ? -1 : 1;
  const offsetMinutes =
    sign * (Number(match?.[2] ?? 0) * 60 + Number(match?.[3] ?? 0));
  return new Date(
    Date.parse(`${date}T${String(hour).padStart(2, '0')}:00:00Z`) -
      offsetMinutes * 60000,
  ).toISOString();
}
