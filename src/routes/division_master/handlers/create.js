import { DivisionMaster } from "../../../controllers";

export const Create = (
  { profile_id, division_name, description },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const division_master = await DivisionMaster.Insert(profile_id, {
        division_name,
        description,
        is_active: true,
      });

      resolve({
        message: "Division master has been inserted successfully",
        data: {
          division_master_id: division_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
