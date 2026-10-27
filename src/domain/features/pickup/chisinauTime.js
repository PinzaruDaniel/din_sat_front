// Pickup creation uses morning/afternoon hours, avoiding ambiguous DST switch hours.
// Derive the date's offset from IANA data instead of hardcoding summer/winter time.
export function chisinauInstant(date, hour) {
  const noon = new Date(`${date}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Chisinau',
    timeZoneName: 'shortOffset',
  }).formatToParts(noon);
  const offset = parts.find((part) => part.type === 'timeZoneName').value;
  const offsetHours = Number(offset.replace('GMT', ''));
  return new Date(
    Date.parse(`${date}T${String(hour).padStart(2, '0')}:00:00Z`) -
      offsetHours * 3600000,
  ).toISOString();
}
