import { SpeciesGradeMaster, SpeciesMaster } from "../../../controllers";

export const Create = (
  { profile_id, grade_name, description },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const species_grade_master = await SpeciesGradeMaster.Insert(profile_id, {
        grade_name,
        description,
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
