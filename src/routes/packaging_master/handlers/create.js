import { PackagingMaster } from "../../../controllers";

export const Create = (
  {
    packaging_name,
    packaging_type,
    packaging_height,
    packaging_width,
    packaging_length,
    package_material_composition,
    package_supplier,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const packaging_master = await PackagingMaster.Insert({
        packaging_name,
        packaging_type,
        packaging_height,
        packaging_width,
        packaging_length,
        package_material_composition,
        package_supplier,
        is_active: true,
        created_by: profile_id,
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
