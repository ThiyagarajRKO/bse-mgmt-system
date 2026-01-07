import { Orders } from "../../../controllers";

export const GetAllocationData = (
  { start, length, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get orders with delivery_status = "Initiated" for allocation
      let orders = await Orders.GetAllocationData({
        start,
        length,
        search,
      });

      if (!orders) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: orders,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
