import { CustomerMaster } from "../../../controllers";

export const Get = ({ customer_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let customer_master = await CustomerMaster.Get({
        id: customer_master_id,
      });

      if (!customer_master) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: customer_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
