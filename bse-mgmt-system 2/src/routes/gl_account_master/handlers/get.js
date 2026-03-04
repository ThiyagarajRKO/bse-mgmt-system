import { GlAccountMaster } from "../../../controllers";

export const Get = ({ id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const account = await GlAccountMaster.Get(id);

      resolve({
        message: "GL account retrieved successfully",
        data: account,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
