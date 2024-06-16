import { LocationMaster, SupplierMaster } from "../../../controllers";

export const Create = (
  {
    profile_id,
    supplier_name,
    supplier_profile_url,
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

      const supplier_master = await SupplierMaster.Insert(profile_id, {
        supplier_name,
        supplier_profile_url,
        representative,
        address,
        phone,
        email,
        location_master_id,
        is_active: true,
      });

      resolve({
        message: "Supplier master data has been inserted successfully",
        data: {
          supplier_master_id: supplier_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
