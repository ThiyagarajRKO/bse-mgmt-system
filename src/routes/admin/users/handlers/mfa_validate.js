import { Users } from "../../../../controllers";
import { ValidateMFA } from "../utils/totp";

export const ValidateMFACode = async ({ user_id, code }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!session?.is_otp_verified) {
        return reject({ message: "OTP must be validated" });
      }

      if (!user_id) {
        return reject({ message: "User didn't log in" });
      }

      if (!code) {
        return reject({ message: "TOTP code mustn't empty" });
      }

      let user_data = await Users.GetUserAndProfileById({
        id: user_id,
        userType: "Admin",
      });

      if (!user_data) {
        return reject({
          message: "User doesn't exists!",
        });
      }

      let totp_validation_result = await ValidateMFA({
        secret: user_data?.totp_secret,
        token: code,
      });

      if (!totp_validation_result) {
        return reject({ message: "Invalid MFA Code!" });
      }

      let user_status = user_data?.dataValues?.user_status;
      let is_mobile_verified = user_data?.dataValues?.is_mobile_verified;
      let is_email_verified = user_data?.dataValues?.is_email_verified;
      let email = user_data?.dataValues?.email;
      let phone = user_data?.dataValues?.phone;

      let output_user_data = {
        id: user_data?.dataValues?.UserProfile?.dataValues?.id,
        full_name: user_data?.dataValues?.UserProfile?.dataValues?.full_name,
        first_name: user_data?.dataValues?.UserProfile?.dataValues?.first_name,
        last_name: user_data?.dataValues?.UserProfile?.dataValues?.last_name,
        dob: user_data?.dataValues?.UserProfile?.dataValues?.is_dob_public
          ? user_data?.dataValues?.UserProfile?.dataValues?.dob
          : "",
        dob_visible_status:
          user_data?.dataValues?.UserProfile?.dataValues?.is_dob_public,
        country_code: user_data?.country_code,
        is_admin: true,
        user_status,
        is_mobile_verified,
        is_email_verified,
        email,
        phone,
        avatar_info: {
          avatar_main_url:
            user_data?.dataValues?.UserProfile?.dataValues?.avatar_main_url,
          avatar_small_url:
            user_data?.dataValues?.UserProfile?.dataValues?.avatar_small_url,
          avatar_bg_color:
            user_data?.dataValues?.UserProfile?.dataValues?.avatar_bg_color,
        },
      };

      // Here is we add token into the Cookie
      session.pid = user_data?.dataValues?.UserProfile?.dataValues?.id;
      session.is_mfa_verified = true;

      resolve({ data: { userdata: output_user_data } });

      if (!user_data?.is_mfa_activated) {
        Users.Update(user_id, {
          is_mfa_activated: true,
          updated_at: new Date(),
        });
      }
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
