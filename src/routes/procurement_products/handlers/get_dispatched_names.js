import { ProcurementProducts } from "../../../controllers";

export const GetDispatchedNames = (
  {
    procurement_lot_id,
    unit_master_id,
    start,
    length,
    "search[value]": search,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let procurement = await ProcurementProducts.GetDispatchedProductNames({
        procurement_lot_id,
        unit_master_id,
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
