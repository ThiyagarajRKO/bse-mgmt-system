import { ProductGstMapping } from "../../../controllers";

export const Delete = ({ profile_id, id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await ProductGstMapping.Delete(profile_id, id);

      resolve({
        message: result.message,
        data: {},
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
