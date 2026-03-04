import { InventoryMaster, SupplierMaster } from "../../../controllers";

export const Update = (
  { profile_id, inventory_master_id, inventory_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (inventory_master_data?.supplier_master_id) {
        const supplier_count = await SupplierMaster.Count({
          id: inventory_master_data?.supplier_master_id,
        });

        if (supplier_count == 0) {
          return reject({
            statusCode: 420,
            message: "Invalid Supplier master id!",
          });
        }
      }

      const updated_data = await InventoryMaster.Update(
        profile_id,
        inventory_master_id,
        inventory_master_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Inventory master has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Inventory master didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
