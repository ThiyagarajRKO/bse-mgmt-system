import { SpeciesGradeMaster, SpeciesMaster } from "../../../controllers";

export const Update = (
  { profile_id, species_grade_master_id, species_grade_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (species_grade_master_data?.location_master_id) {
        const species_count = await SpeciesMaster.Count({
          id: species_grade_master_data?.species_master_id,
        });

        if (species_count == 0) {
          return reject({
            statusCode: 420,
            message: "Invalid species master id!",
          });
        }
      }

      const updated_data = await SpeciesGradeMaster.Update(
        profile_id,
        species_grade_master_id,
        species_grade_master_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Species grade has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Species grade didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
