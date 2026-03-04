import { PeeledDispatches } from "../../../controllers";

export const GetProductNames = (
  {
    procurement_lot_id,
    packing_id,
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
      let pack = await PeeledDispatches.GetProductNames({
        procurement_lot_id,
        packing_id,
        unit_master_id,
        start,
        length,
        search,
      });

      if (!pack) {
        return reject({
          statusCode: 420,
          message: "No rows found!",
        });
      }

      resolve({
        data: pack,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
