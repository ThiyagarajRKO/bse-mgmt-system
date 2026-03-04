import { LedgerMaster } from "../../../controllers";

export const Get = ({ id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await LedgerMaster.Get(id);

      resolve({
        message: "Ledger retrieved successfully",
        data: result.data,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
