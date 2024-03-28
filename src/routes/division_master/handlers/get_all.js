import { DivisionMaster } from "../../../controllers";

export const GetAll = ({ division_name, start, length }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let division_master = await DivisionMaster.GetAll({
        division_name,
        start,
        length,
      });

      if (!division_master) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: division_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
