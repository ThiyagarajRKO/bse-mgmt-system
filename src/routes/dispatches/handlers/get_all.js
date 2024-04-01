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
      let unit_master = await Dispatches.GetAll({
        start,
        length,
        unit_code,
        unit_name,
        unit_type,
        location_master_name,
        search,
      });

      if (!unit_master) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: unit_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
