import { ProcurementLots } from "../../../controllers";

export const GetAll = (
  { procurement_date, procurement_lot, unit_master_name },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let procurement = await ProcurementLots.GetAll({
        procurement_date,
        procurement_lot,
        unit_master_name,
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
