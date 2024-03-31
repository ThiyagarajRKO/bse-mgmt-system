import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, audit_logs_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!audit_logs_data?.action_name) {
        return reject({
          statusCode: 420,
          message: "Audit Logs action name must not be empty!",
        });
      }

      if (!audit_logs_data?.source_ip_address) {
        return reject({
          statusCode: 420,
          message: "source ip address must not be empty!",
        });
      }

      if (!audit_logs_data?.module_master_id) {
        return reject({
          statusCode: 420,
          message: "Module master id must not be empty!",
        });
      }

      const result = await models.AuditLogs.create(audit_logs_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Audit Logs already exists!",
        });
      }
      reject(err);
    }
  });
};

export const GetAll = ({ start, length, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (search) {
        where[Op.or] = [
          { source_ip_address: { [Op.iLike]: `%${search}%` } },
          { user_agent: { [Op.iLike]: `%${search}%` } },
          { action_name: { [Op.iLike]: `%${search}%` } },
          { "$ModuleMaster.module_name$": { [Op.iLike]: `%${search}%` } },
          { "$creator.creator.email$": { [Op.iLike]: `%${search}%` } },
          { "$creator.creator.username$": { [Op.iLike]: `%${search}%` } },
        ];
      }

      const auditLogss = await models.AuditLogs.findAndCountAll({
        required: true,
        include: [
          {
            model: models.ModuleMaster,
            where: {
              is_active: true,
            },
          },
          {
            required: true,
            attributes: ["id"],
            as: "creator",
            model: models.UserProfiles,
            include: [
              {
                as: "creator",
                attributes: ["username", "email"],
                model: models.Users,
                where: {
                  is_active: true,
                },
              },
            ],
            where: {
              is_active: true,
            },
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(auditLogss);
    } catch (err) {
      reject(err);
    }
  });
};
