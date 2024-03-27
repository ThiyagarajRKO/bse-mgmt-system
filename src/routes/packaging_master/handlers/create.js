import { PackagingMaster, VendorMaster } from "../../../controllers";

export const Create = (
  {
    profile_id,
    packaging_type,
    packaging_height,
    packaging_width,
    packaging_length,
    packaging_weight,
    packaging_material_composition,
    vendor_master_id
  },
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
      const packaging_master = await PackagingMaster.Insert(profile_id, {
        packaging_type,
        packaging_height,
        packaging_width,
        packaging_length,
        packaging_weight,
        packaging_material_composition,
        vendor_master_id,
        is_active: true,
      });

      resolve({
        message: "Packaging master has been inserted successfully",
        data: {
          packaging_master_id: packaging_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
