import { TaxCodeMaster } from "../../../controllers";

export const Get = ({ id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await TaxCodeMaster.Get(id);

      resolve({
        message: "Tax code retrieved successfully",
        data: result.data,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
