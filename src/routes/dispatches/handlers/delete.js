import { Dispatches } from "../../../controllers";

export const Delete = ({ profile_id, unit_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const unit_master = await Dispatches.Delete({
        profile_id,
        id: unit_master_id,
      });

      if (unit_master > 0) {
        return resolve({
          message: "Dispatch data has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Dispatch data didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
