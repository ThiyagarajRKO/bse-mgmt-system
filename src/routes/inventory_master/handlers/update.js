import { InventoryMaster, VendorMaster } from "../../../controllers";

export const Update = (
  { profile_id, inventory_master_id, inventory_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (inventory_master_data?.vendor_master_id) {
        const vendor_count = await VendorMaster.Count({
          id: inventory_master_data?.vendor_master_id,
        });

        if (vendor_count == 0) {
          return reject({
            statusCode: 420,
            message: "Invalid Vendor master id!",
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
