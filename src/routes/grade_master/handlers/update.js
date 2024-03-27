import { GradeMaster, SpeciesMaster } from "../../../controllers";

export const Update = (
  { profile_id, grade_master_id, grade_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (grade_master_data?.location_master_id) {
        const species_count = await SpeciesMaster.Count({
          id: grade_master_data?.species_master_id,
        });

        if (species_count == 0) {
          return reject({
            statusCode: 420,
            message: "Invalid species master id!",
          });
        }
      }

      const updated_data = await GradeMaster.Update(
        profile_id,
        grade_master_id,
        grade_master_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Grade has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Grade didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
