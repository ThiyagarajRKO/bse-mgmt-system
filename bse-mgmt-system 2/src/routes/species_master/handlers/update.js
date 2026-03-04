import { SpeciesMaster } from "../../../controllers";

export const Update = (
  { profile_id, species_master_id, species_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated_data = await SpeciesMaster.Update(
        profile_id,
        species_master_id,
        species_master_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Species master has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Species master didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
