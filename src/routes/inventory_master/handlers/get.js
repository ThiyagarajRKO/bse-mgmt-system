import { InventoryMaster } from "../../../controllers";

export const Get = ({ inventory_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let inventory_master = await InventoryMaster.Get({
        id: inventory_master_id,
      });

      if (!inventory_master) {
        return reject({
          statusCode: 420,
          message: "No data found!",
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
