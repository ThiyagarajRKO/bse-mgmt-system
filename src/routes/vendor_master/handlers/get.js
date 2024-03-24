import { VendorMaster } from "../../../controllers";

export const Get = ({ vendor_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let vendor_master = await VendorMaster.Get({ id: vendor_master_id });

      if (!vendor_master) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: vendor_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
