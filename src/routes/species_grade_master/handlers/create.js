import { SpeciesGradeMaster, SpeciesMaster } from "../../../controllers";

export const Create = (
  { profile_id, grade_name, description, species_master_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const species_count = await SpeciesMaster.Count({
        id: species_master_id,
      });

      if (species_count == 0) {
        return reject({
          statusCode: 420,
          message: "Invalid species master id!",
        });
      }

      const species_grade_master = await SpeciesGradeMaster.Insert(profile_id, {
        grade_name,
        description,
        species_master_id,
        is_active: true,
      });

      resolve({
        message: "Species grade has been inserted successfully",
        data: {
          species_grade_master_id: species_grade_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
