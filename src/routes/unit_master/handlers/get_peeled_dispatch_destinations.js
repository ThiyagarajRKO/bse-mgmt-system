import { UnitMaster } from "../../../controllers";

export const GetPeeledDispatches = (
  { procurement_lot_id, start, length },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let procurement = await UnitMaster.GetPeeledDispatches({
        procurement_lot_id,
        start,
        length,
      });

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
      fastify.log.error(err);
      reject(err);
    }
  });
};
