import { ProcurementLots } from "../../../controllers";

export const GetPackingLots = ({ start, length }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let packing = await ProcurementLots.GetPackingLots({
        start,
        length,
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
