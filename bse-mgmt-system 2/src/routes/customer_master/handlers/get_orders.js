import { CustomerMaster } from "../../../controllers";

export const GetOrders = (
  { start, length, customer_name, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let customer_master = await CustomerMaster.GetOrders({
        start,
        length,
        customer_name,
        search,
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
