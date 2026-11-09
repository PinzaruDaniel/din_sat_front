// The UI depends on these operations, so the HTTP adapter can be replaced in tests.
export function createCatalogActions(api) {
  return {
    list: api.list,
    details: api.details,
    owned: api.owned,
    create: api.create,
    update: api.update,
    archive: api.archive,
    upload: api.upload,
  };
}
