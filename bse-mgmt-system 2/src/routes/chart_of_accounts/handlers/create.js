import { ChartOfAccounts } from "../../../controllers";

export const Create = (
  {
    profile_id,
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
      const account = await ChartOfAccounts.Insert(profile_id, {
        account_code,
        account_name,
        account_type,
        company_id,
        description,
        is_active: true,
      });

      resolve({
        message: "Chart of account has been created successfully",
        data: {
          account_id: account?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
