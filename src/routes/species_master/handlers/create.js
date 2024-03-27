import { SpeciesMaster } from "../../../controllers";

export const Create = (
  { profile_id, species_name, scientific_name, description },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const species_master = await SpeciesMaster.Insert(profile_id, {
        species_name,
        description,
        scientific_name,
        is_active: true,
      });

      resolve({
        message: "Species master has been inserted successfully",
        data: {
          species_master_id: species_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
