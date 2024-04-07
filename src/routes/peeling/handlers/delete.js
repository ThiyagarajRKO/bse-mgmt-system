import { Peeling } from "../../../controllers";

export const Delete = ({ profile_id, peeling_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const peeling = await Peeling.Delete({
        profile_id,
        id: peeling_id,
      });

      if (peeling > 0) {
        return resolve({
          message: "Peeling data has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Peeling data didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
