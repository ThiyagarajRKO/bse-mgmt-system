import { UnitMaster } from "../../../controllers";

export const Delete = ({ profile_id, unit_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const unit_master = await UnitMaster.Delete({
        profile_id,
        id: unit_master_id,
      });

      if (unit_master > 0) {
        return resolve({
          message: "Unit master has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Unit master didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
