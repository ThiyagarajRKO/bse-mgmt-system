import { Packing } from "../../../controllers";

export const Delete = ({ profile_id, packing_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const packing = await Packing.Delete({
        profile_id,
        id: packing_id,
      });

      if (packing > 0) {
        return resolve({
          message: "Packing data has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Packing data didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
