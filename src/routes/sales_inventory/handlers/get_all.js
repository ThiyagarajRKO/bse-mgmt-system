import { SalesInventory } from "../../../controllers";

export const GetAll = (
  { start, length, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let sales_inventory = await SalesInventory.GetAll({
        start,
        length,
        search,
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
