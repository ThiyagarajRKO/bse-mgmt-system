import { Users } from "../../../controllers";
import bcrypt from "bcrypt";

export const SignIn = (
  { username, email, phone, password, role_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!username && !email && !password) {
        return reject({ message: "identity should not be empty" });
      }

      if (!role_id) {
        return reject({
          statusCode: 400,
          message: "Role must be selected for login",
        });
      }

      // Creating User
      let user_data = await Users.Get({
        username,
        email,
        phone,
        role_id,
      });

      if (!user_data) {
        return reject({
          statusCode: 403,
          message: "User doesn't exists with the selected role!",
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

      // Verify user profile exists
      if (!user_data?.creator) {
        return reject({
          statusCode: 403,
          message: "User profile not found or inactive",
        });
      }

      // Here is we add token into the Cookie
      session.pid = user_data?.creator?.id;
      session.role_id = user_data?.creator?.role_id;
      session.role_name = user_data?.creator?.RoleMaster?.role_name;
      session.username = user_data?.username;
      session.full_name = user_data?.creator?.full_name;

      resolve({
        data: {
          user_id: user_data?.creator?.id,
          full_name: user_data?.creator?.full_name,
          username: user_data?.username,
          role_id: user_data?.creator?.role_id,
          role_name: user_data?.creator?.RoleMaster?.role_name,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
