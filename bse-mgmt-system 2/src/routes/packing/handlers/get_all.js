import { Packing } from "../../../controllers";

export const GetAll = (
  { procurement_lot_id, start, length, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let packing = await Packing.GetAll({
        procurement_lot_id,
        start,
        length,
        search,
      });

      if (!packing) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: packing,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
