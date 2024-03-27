import { GradeMaster } from "../../../controllers";

export const Create = (
  { profile_id, grade_name, description },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const grade_master = await GradeMaster.Insert(profile_id, {
        grade_name,
        description,
        is_active: true,
      });

      resolve({
        message: "Grade has been inserted successfully",
        data: {
          grade_master_id: grade_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
