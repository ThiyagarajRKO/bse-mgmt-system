import { LocationMaster, VendorMaster } from "../../../controllers";

export const Create = (
  {
    profile_id,
    vendor_name,
    vendor_profile_url,
    representative,
    address,
    phone,
    email,
    location_master_id,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const location_count = await LocationMaster.Count({
        id: location_master_id,
      });

      if (location_count == 0) {
        return reject({
          statusCode: 420,
          message: "Invalid location master id!",
        });
      }

      const vendor_master = await VendorMaster.Insert(profile_id, {
        vendor_name,
        vendor_profile_url,
        representative,
        address,
        phone,
        email,
        location_master_id,
        created_by: profile_id,
        is_active: true,
      });

      resolve({
        message: "Vendor master data has been inserted successfully",
        data: {
          vendor_master_id: vendor_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
