import { SizeMaster } from "../../../controllers";

export const Delete = ({ profile_id, size_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const size_master = await SizeMaster.Delete({
        profile_id,
        id: size_master_id,
      });

      if (size_master > 0) {
        return resolve({
          message: "Size has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Size didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
