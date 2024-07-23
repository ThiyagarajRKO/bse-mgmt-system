import { ProcurementLots } from "../../../controllers";

export const GetDispatchLots = (
  { unit_master_id, start, length, dropdownSearch },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let procurement = await ProcurementLots.GetDispatchLots({
        unit_master_id,
        start,
        length,
        dropdownSearch,
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
