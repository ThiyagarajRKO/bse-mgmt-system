import { Peeling } from "../../../controllers";

export const GetAll = (
  { peeling_id, start, length, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let peeling = await Peeling.GetAll({
        peeling_id,
        start,
        length,
        search,
      });

      if (!peeling) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: peeling,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
