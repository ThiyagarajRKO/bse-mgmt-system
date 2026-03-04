import { ChartOfAccounts } from "../../../controllers";

export const GetAll = (params, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await ChartOfAccounts.GetAll(params);

      resolve({
        message: "Accounts retrieved successfully",
        data: result.rows,
        recordsTotal: result.recordsTotal,
        recordsFiltered: result.recordsFiltered,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
