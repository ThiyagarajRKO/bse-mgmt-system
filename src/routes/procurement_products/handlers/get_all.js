import { ProcurementProducts } from "../../../controllers";

export const GetAll = (params, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Handler called with params:", params);
      const procurement = await ProcurementProducts.GetAll(params);

      if (!procurement) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: procurement,
      });
    } catch (err) {
      console.error("Handler error:", err);
      fastify.log.error(err);
      reject(err);
    }
  });
};
