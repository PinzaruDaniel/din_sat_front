export function createOrdersActions(api) {
  return { list: api.list, create: api.create, update: api.update };
}
