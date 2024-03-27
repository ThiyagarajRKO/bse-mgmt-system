import { SpeciesGradeMaster } from "../../../controllers";

export const GetAll = (
  { start, length, species_grade_name },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let species_grade_master = await SpeciesGradeMaster.GetAll({
        start,
        length,
        species_grade_name,
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
