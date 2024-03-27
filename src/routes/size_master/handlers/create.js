import { SizeMaster } from "../../../controllers";

export const Create = ({ profile_id, size, description }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const size_master = await SizeMaster.Insert(profile_id, {
        size,
        description,
        is_active: true,
      });

      resolve({
        message: "Size has been inserted successfully",
        data: {
          size_master_id: size_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
