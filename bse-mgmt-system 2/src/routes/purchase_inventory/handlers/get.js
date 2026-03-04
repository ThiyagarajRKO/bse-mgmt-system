import { PurchaseInventory } from "../../../controllers";

export const Get = ({ purchase_inventory_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let purchase_inventory = await PurchaseInventory.Get({
        purchase_inventory_id,
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
