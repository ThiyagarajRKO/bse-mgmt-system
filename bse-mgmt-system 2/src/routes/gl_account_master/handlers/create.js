import { GlAccountMaster } from "../../../controllers";

export const Create = (
  {
    profile_id,
    account_code,
    account_name,
    account_type,
    company_id,
    parent_account_code,
    description,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const account = await GlAccountMaster.Insert(profile_id, {
        account_code,
        account_name,
        account_type,
        company_id,
        parent_account_code,
        description,
        is_active: true,
      });

      resolve({
        message: "GL account has been created successfully",
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
