import { Dispatches } from "../../../controllers";

export const Delete = ({ profile_id, dispatch_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const dispatch = await Dispatches.Delete({
        profile_id,
        id: dispatch_id,
      });

      if (dispatch > 0) {
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
