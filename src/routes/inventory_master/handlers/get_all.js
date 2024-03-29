import { InventoryMaster } from "../../../controllers";

export const GetAll = (
  {
    start,
    length,
    inventory_name,
    inventory_uom,
    inventory_category,
    vendor_master_name,
    "search[value]": search,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let inventory_master = await InventoryMaster.GetAll({
        start,
        length,
        inventory_name,
        inventory_uom,
        inventory_category,
        vendor_master_name,
        search,
      });

      if (!inventory_master) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: inventory_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
