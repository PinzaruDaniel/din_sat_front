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
  }).format(new Date(slot.startsAt));
  const time = (value) =>
    new Intl.DateTimeFormat('ro-MD', {
      timeZone: slot.timeZone,
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  return `${date}, ${time(slot.startsAt)}–${time(slot.endsAt)} · ${slot.location}`;
}
export const orderStatuses = {
  new: 'Nouă',
  confirmed: 'Confirmată',
  preparing: 'În pregătire',
  ready: 'Gata de ridicare',
  completed: 'Finalizată',
  cancelled: 'Anulată',
};
