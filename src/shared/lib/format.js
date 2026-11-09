export const money = (value) =>
  new Intl.NumberFormat('ro-MD', { maximumFractionDigits: 2 }).format(
    Number(value),
  );
export function pickupLabel(slot) {
  const date = new Intl.DateTimeFormat('ro-MD', {
    timeZone: slot.timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const time = new Intl.DateTimeFormat('ro-MD', {
    timeZone: slot.timeZone,
    hour: '2-digit',
    minute: '2-digit',
  });
  const start = new Date(slot.startsAt);
  const end = new Date(slot.endsAt);
  const startDate = date.format(start);
  const endDate = date.format(end);
  const endLabel =
    startDate === endDate
      ? time.format(end)
      : `${endDate}, ${time.format(end)}`;
  return `${startDate}, ${time.format(start)}–${endLabel} (${slot.timeZone}) · ${slot.location}`;
}
export const orderStatuses = {
  new: 'Nouă',
  confirmed: 'Confirmată',
  preparing: 'În pregătire',
  ready: 'Gata de ridicare',
  completed: 'Finalizată',
  cancelled: 'Anulată',
};
