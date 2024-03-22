import models from "../../models";
const Op = models.Sequelize.Op;

export const DeleteSession = async ({ sid }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!sid) {
        return reject({
          statusCode: 400,
          message: "SID should not be empty!",
        });
      }

      const result = await models.Sessions.destroy({
        where: { sid },
      });
      console.log(result);
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};
