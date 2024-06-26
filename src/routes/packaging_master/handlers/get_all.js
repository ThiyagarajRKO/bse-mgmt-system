import { PackagingMaster } from "../../../controllers";

export const GetAll = (
  {
    packaging_code,
    packaging_type,
    packaging_height,
    packaging_width,
    packaging_length,
    packaging_weight,
    package_material_composition,
    supplier_master_name,
    "search[value]": search,
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
        packaging_weight,
        package_material_composition,
        supplier_master_name,
        search,
      });

      if (!packaging_master) {
        return reject({
          statusCode: 420,
          message: "No data found!",
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
