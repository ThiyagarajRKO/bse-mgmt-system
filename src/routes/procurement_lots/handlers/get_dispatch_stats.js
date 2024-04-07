import { ProcurementLots } from "../../../controllers";

export const GetDispatchStats = (
  { procurement_lot_id, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let procurement = await ProcurementLots.GetDispatchStats({
        procurement_lot_id,
        search,
      });

      if (!procurement) {
        return reject({
          statusCode: 420,
          message: "No rows found!",
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
