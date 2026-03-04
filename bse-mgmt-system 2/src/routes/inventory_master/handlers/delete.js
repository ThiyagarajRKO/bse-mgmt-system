import { InventoryMaster } from "../../../controllers";

export const Delete = ({ profile_id, inventory_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const inventory_master = await InventoryMaster.Delete({
        profile_id,
        id: inventory_master_id,
      });

      if (inventory_master > 0) {
        return resolve({
          message: "Inventory master has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Inventory master was not deleted",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
