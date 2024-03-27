import { InventoryMaster, VendorMaster } from "../../../controllers";

export const Create = (
  { profile_id, inventory_name, inventory_uom, inventory_category, vendor_master_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const vendor_count = await VendorMaster.Count({
        id: vendor_master_id,
      });

      if (vendor_count == 0) {
        return reject({
          statusCode: 420,
          message: "Invalid vendor master id!",
        });
      }

      const inventory_master = await InventoryMaster.Insert(profile_id, {
        inventory_name,
        inventory_uom,
        inventory_category,
        vendor_master_id,
        is_active: true,
      });

      resolve({
        message: "Inventory master has been inserted successfully",
        data: {
          inventory_master_id: inventory_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
