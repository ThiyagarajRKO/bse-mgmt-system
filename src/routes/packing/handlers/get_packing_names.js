import { Packing } from "../../../controllers";

export const GetPackingNames = ({ start, length }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let packing = await Packing.GetNames({
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
