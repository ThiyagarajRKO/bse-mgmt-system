import { SpeciesMaster } from "../../../controllers";

export const Get = ({ species_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let species_master = await SpeciesMaster.Get({
        id: species_master_id,
      });

      if (!species_master) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: species_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
