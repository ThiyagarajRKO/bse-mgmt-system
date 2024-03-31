import { AuditLogs } from "../../../controllers";

export const GetAll = (
  { start, length, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let audit_logs = await AuditLogs.GetAll({
        start,
        length,
        search,
      });

      if (!audit_logs) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: audit_logs,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
