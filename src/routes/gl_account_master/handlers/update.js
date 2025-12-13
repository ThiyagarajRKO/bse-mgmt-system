import { GlAccountMaster } from "../../../controllers";

export const Update = (
  {
    profile_id,
    id,
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
      const account = await GlAccountMaster.Update(profile_id, id, {
        account_code,
        account_name,
        account_type,
        company_id,
        parent_account_code,
        description,
      });

      resolve({
        message: "GL account has been updated successfully",
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
