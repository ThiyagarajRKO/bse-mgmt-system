import { PurchaseInventory } from "../../../controllers";

export const GetAll = (
  { start, length, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let purchase_inventory = await PurchaseInventory.GetAll({
        start,
        length,
        search,
      });

      if (!purchase_inventory) {
        return reject({
          message: "No data found!",
        });
      }

      resolve({
        data: purchase_inventory,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
