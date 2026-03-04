import { SupplierMaster } from "../../../controllers";

export const Get = ({ supplier_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let supplier_master = await SupplierMaster.Get({
        id: supplier_master_id,
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
