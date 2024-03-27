import { SpeciesGradeMaster } from "../../../controllers";

export const Get = ({ species_grade_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let species_grade_master = await SpeciesGradeMaster.Get({
        id: species_grade_master_id,
      });

      if (!species_grade_master) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: species_grade_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
