import { UnitMaster } from "../../../controllers";

export const GetAll = (
  { start, length, unit_code, unit_type, unit_name, location_master_name },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let unit_master = await UnitMaster.GetAll({
        start,
        length,
        unit_code,
        unit_name,
        unit_type,
        location_master_name,
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
