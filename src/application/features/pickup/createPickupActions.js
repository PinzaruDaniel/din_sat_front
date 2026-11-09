export function createPickupActions(api) {
  return {
    list: api.list,
    listOwned: api.listOwned,
    listPoints: api.listPoints,
    createPoint: api.createPoint,
    updatePoint: api.updatePoint,
    create: api.create,
    updateCapacity: api.updateCapacity,
  };
}
