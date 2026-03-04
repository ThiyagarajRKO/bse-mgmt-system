import { SupplierMaster } from "../../../controllers";

export const GetAll = (
  {
    start,
    length,
    supplier_name,
    location_master_name,
    "search[value]": search,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let supplier_master = await SupplierMaster.GetAll({
        start,
        length,
        supplier_name,
        location_master_name,
        search,
      });

      if (!supplier_master) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: supplier_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
