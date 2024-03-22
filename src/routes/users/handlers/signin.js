import { Users } from "../../../controllers";
import bcrypt from "bcrypt";

export const SignIn = ({ identity, password, role_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let user_data = await Users.GetUserAndProfileByIdentifier({
        username: identity,
        email: identity,
        phone: identity,
        role_id,
      });

      if (!user_data) {
        return reject({
          statusCode: 403,
          message: "User doesn't exists!",
        });
      }

      // Checking secret
      const valid = bcrypt.compareSync(password, user_data?.password);
      if (!valid) {
        return reject({
          statusCode: 403,
          message: "Invalid credential",
        });
      }

      // Here is we add token into the Cookie
      session.pid = user_data?.UserProfile?.id;
      session.role_id = user_data?.UserProfile?.role_id;
      session.role_name = user_data?.UserProfile?.RoleMaster?.role_name;
      session.username = user_data?.username;
      session.full_name = user_data?.UserProfile?.full_name;

      resolve({
        data: {
          user_id: user_data?.UserProfile?.id,
          full_name: user_data?.UserProfile?.full_name,
          username: user_data?.username,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
