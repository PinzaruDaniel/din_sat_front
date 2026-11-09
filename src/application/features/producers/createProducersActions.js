export function createProducersActions(api) {
  return {
    list: api.list,
    details: api.details,
    own: api.own,
    update: api.update,
  };
}
