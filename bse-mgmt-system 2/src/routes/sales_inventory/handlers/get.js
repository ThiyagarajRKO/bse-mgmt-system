import { SalesInventory } from "../../../controllers";

export const Get = ({ sales_inventory_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let sales_inventory = await SalesInventory.Get({
        sales_inventory_id,
      });

      if (!sales_inventory) {
        return reject({
          message: "No data found!",
        });
      }

      resolve({
        data: sales_inventory,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
