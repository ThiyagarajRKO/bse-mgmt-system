import { LedgerMaster } from "../../../controllers";

export const Create = (
  {
    profile_id,
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
      const ledger = await LedgerMaster.Insert(profile_id, {
        ledger_code,
        ledger_name,
        coa_account_id,
        company_id,
        description,
        is_active: true,
      });

      resolve({
        message: "Ledger has been created successfully",
        data: {
          ledger_id: ledger?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
