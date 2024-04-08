import { Dispatches } from "../../../controllers";

export const GetProductNames = (
  {
    procurement_lot_id,
    peeling_id,
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
      let dispatch = await Dispatches.GetProductNames({
        procurement_lot_id,
        peeling_id,
        unit_master_id,
        start,
        length,
        search,
      });

      if (!dispatch) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: dispatch,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
