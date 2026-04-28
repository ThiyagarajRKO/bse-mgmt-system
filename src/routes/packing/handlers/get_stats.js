import { Packing } from "../../../controllers";

export const GetStats = ({ procurement_lot_id, search }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let packing = await Packing.GetStats({
        procurement_lot_id,
        search,
      });

      if (!packing) {
        return reject({
          statusCode: 420,
          message: "No rows found!",
        });
      }

      resolve(packing);
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
