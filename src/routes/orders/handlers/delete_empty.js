import { Orders } from "../../../controllers";

export const DeleteEmpty = ({ profile_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await Orders.DeleteEmpty({
        profile_id,
      });

      resolve({
        statusCode: 200,
        message: result.message,
        data: {
          deletedCount: result.deletedCount,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
