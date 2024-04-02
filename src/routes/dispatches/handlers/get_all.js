import { Dispatches } from "../../../controllers";

export const GetAll = (
  {
    start,
    length,
    unit_code,
    unit_type,
    unit_name,
    location_master_name,
    "search[value]": search,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let dispatch = await Dispatches.GetAll({
        start,
        length,
        unit_code,
        unit_name,
        unit_type,
        location_master_name,
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
