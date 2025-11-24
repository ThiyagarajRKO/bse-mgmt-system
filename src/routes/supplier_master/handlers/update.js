import { LocationMaster, SupplierMaster, CompanyMaster } from "../../../controllers";

export const Update = (
  { profile_id, supplier_master_id, supplier_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (supplier_master_data?.location_master_id) {
        const location_count = await LocationMaster.Count({
          id: supplier_master_data?.location_master_id,
        });

        if (location_count == 0) {
          return reject({
            statusCode: 420,
            message: "Invalid location master id!",
          });
        }
      }

      if (supplier_master_data?.company_id) {
        const company = await CompanyMaster.Get({
          id: supplier_master_data?.company_id,
        });

        if (!company) {
          return reject({
            statusCode: 420,
            message: "Invalid company id!",
          });
        }
      }

      const updated_data = await SupplierMaster.Update(
        profile_id,
        supplier_master_id,
        supplier_master_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Supplier master has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Supplier master didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
