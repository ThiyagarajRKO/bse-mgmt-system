import { SpeciesMaster } from "../../../controllers";

export const Delete = ({ profile_id, species_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const species_master = await SpeciesMaster.Delete({
        profile_id,
        id: species_master_id,
      });

      if (species_master > 0) {
        return resolve({
          message: "Species master has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Species master didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
