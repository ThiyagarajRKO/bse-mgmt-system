import { PackagingMaster } from "../../../controllers";

export const GetAll = (
  {
    packaging_code,
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
      let packaging_master = await PackagingMaster.GetAll({
        packaging_code,
        packaging_type,
        packaging_height,
        packaging_width,
        packaging_length,
        package_material_composition,
        package_supplier,
      });

      if (!packaging_master) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: packaging_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
