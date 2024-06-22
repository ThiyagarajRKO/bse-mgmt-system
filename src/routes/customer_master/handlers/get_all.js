import { CustomerMaster } from "../../../controllers";

export const GetAll = (
  { start, length, customer_name, "search[value]": tableSearch, search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let customer_master = await CustomerMaster.GetAll({
        start,
        length,
        customer_name,
        search,
        tableSearch,
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
