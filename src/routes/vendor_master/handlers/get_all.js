import { VendorMaster } from "../../../controllers";

export const GetAll = ({ vendor_name, location_name }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let vendor_master = await VendorMaster.GetAll({
        vendor_name,
        location_name,
      });

      if (!vendor_master) {
        return reject({
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
