import { LedgerMaster } from "../../../controllers";

export const Update = (
  {
    profile_id,
    id,
    ledger_code,
    ledger_name,
    coa_account_id,
    company_id,
    description,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await LedgerMaster.Update(profile_id, id, {
        ledger_code,
        ledger_name,
        coa_account_id,
        company_id,
        description,
      });

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
