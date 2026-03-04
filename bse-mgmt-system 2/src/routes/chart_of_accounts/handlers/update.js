import { ChartOfAccounts } from "../../../controllers";

export const Update = (
  {
    profile_id,
    id,
    account_code,
    account_name,
    account_type,
    company_id,
    description,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await ChartOfAccounts.Update(profile_id, id, {
        account_code,
        account_name,
        account_type,
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
