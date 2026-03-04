import { PeelingProducts } from "../../../controllers";

export const GetNames = (
  {
    procurement_lot_id,
    peeled_dispatch_id,
    start,
    length,
    "search[value]": search,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let procurement = await PeelingProducts.GetNames({
        procurement_lot_id,
        peeled_dispatch_id,
        start,
        length,
        search,
      });

      if (!procurement) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: procurement,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
