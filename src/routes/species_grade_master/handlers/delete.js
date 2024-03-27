import { SpeciesGradeMaster } from "../../../controllers";

export const Delete = (
  { profile_id, species_grade_master_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const species_grade_master = await SpeciesGradeMaster.Delete({
        profile_id,
        id: species_grade_master_id,
      });

      if (species_grade_master > 0) {
        return resolve({
          message: "Species Grade has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Species grade didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
