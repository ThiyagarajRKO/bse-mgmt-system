import models from "../../models";
const Op = models.Sequelize.Op;

export const Get = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Role master id field must not be empty!",
        });
      }

      const user = await models.RoleMasters.findOne({
        attributes: ["role_name"],
        where: { id, is_active: true },
        raw: true,
      });
      resolve(user);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({ start, length }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await models.RoleMaster.findAll({
        attributes: ["id", "role_name"],
        where: { is_active: true },
        offset: start,
        limit: length,
      });
      resolve(user);
    } catch (err) {
      reject(err);
    }
  });
};
