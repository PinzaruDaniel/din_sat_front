export function createOrdersActions(api) {
  return {
    list: api.list,
    details: api.details,
    create: api.create,
    update: api.update,
    cancel: api.cancel,
  };
}
