// The UI depends on these operations, so the HTTP adapter can be replaced in tests.
export function createCatalogActions(api) {
  return {
    list: api.list,
    details: api.details,
    producers: api.producers,
    create: api.create,
  };
}
