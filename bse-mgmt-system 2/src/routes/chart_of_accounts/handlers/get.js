import { ChartOfAccounts } from "../../../controllers";

export const Get = ({ id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await ChartOfAccounts.Get(id);

      resolve({
        message: "Account retrieved successfully",
        data: result.data,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
