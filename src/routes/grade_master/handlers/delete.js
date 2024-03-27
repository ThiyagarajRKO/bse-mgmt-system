import { GradeMaster } from "../../../controllers";

export const Delete = ({ profile_id, grade_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const grade_master = await GradeMaster.Delete({
        profile_id,
        id: grade_master_id,
      });

      if (grade_master > 0) {
        return resolve({
          message: "Grade has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Grade didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
