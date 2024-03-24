import { VendorMaster } from "../../../controllers";

export const GetAll = (
  { start, length, vendor_name, location_master_name },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let vendor_master = await VendorMaster.GetAll({
        start,
        length,
        vendor_name,
        location_master_name,
      });

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
