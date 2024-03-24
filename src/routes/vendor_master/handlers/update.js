import { LocationMaster, VendorMaster } from "../../../controllers";

export const Update = (
  { profile_id, vendor_master_id, vendor_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (vendor_master_data?.location_master_id) {
        const location_count = await LocationMaster.Count({
          id: vendor_master_data?.location_master_id,
        });

        if (location_count == 0) {
          return reject({
            statusCode: 420,
            message: "Invalid location master id!",
          });
        }
      }

      const updated_data = await VendorMaster.Update(
        profile_id,
        vendor_master_id,
        vendor_master_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Vendor master has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Vendor master didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
