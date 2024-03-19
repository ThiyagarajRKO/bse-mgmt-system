import { Users, UserProfiles } from "../../../../controllers";
import { ChatSignUp } from "../../../../utils/chat/signUp";
import { NotifyUserIdentity } from "../utils/notify_identity";

export const SignUp = (params) => {
  return new Promise(async (resolve, reject) => {
    try {
      let {
        full_name,
        first_name,
        last_name,
        password,
        email = "",
        phone = "",
        dob,
        country_code,
      } = params;

      let user_data = {};
      let profile_data = {};
      let is_new_account = false;

      if (!email && !phone) {
        return reject({
          statusCode: 404,
          message: "Please provide an email or phone number",
        });
      }

      if (phone && !country_code) {
        return reject({
          statusCode: 404,
          message: "Please provide a country code",
        });
      }

      // Checking user existence
      user_data = await Users.GetUserAndProfileByIdentifier({
        email,
        phone,
      });

      if (
        user_data &&
        (user_data?.is_email_verified || user_data?.is_mobile_verified)
      ) {
        return reject({
          statusCode: 409,
          message: "User already exists. Kindly use Signin instead",
        });
      }

      if (!user_data) {
        is_new_account = true;
        user_data = await Users.Insert({
          password,
          is_email_verified: false,
          is_mobile_verified: false,
          user_status: "0",
          email,
          phone,
          country_code,
          is_active: true,
        });

        profile_data = await UserProfiles.Insert({
          full_name,
          first_name,
          last_name,
          role_id: "e7daa45c-627d-455a-ac57-ec32aa57d009",
          dob,
          is_admin: false,
          is_active: true,
          created_by: user_data?.id,
          updated_by: user_data?.id,
        });

        user_data.profile_data = profile_data;

        //Chat SignUp
        await ChatSignUp({
          name: profile_data?.full_name,
          email: email || `${phone}@piechips.com`,
          username: profile_data?.username?.replaceAll("#", "_"),
          password: process.env.CHAT_USER_PASS,
          profile_id: profile_data?.id,
        });
      }

      await NotifyUserIdentity({
        full_name:
          user_data?.full_name ||
          user_data?.profile_data?.dataValues?.full_name,
        email: user_data?.email,
        phone: user_data?.phone,
        user_id: user_data?.id,
        subject: process.env.VERIFY_EMAIL_SUBJECT,
        type: "signup",
      });

      if (is_new_account) {
        //sending response
        resolve({
          message: "Account has been created successfully!",
          data: {
            user_id: user_data?.profile_data?.id,
          },
        });
      } else {
        //sending response
        resolve({
          message: `${email ? "Link" : "OTP"} has been sent to ${
            email ? "Email" : "Phone"
          }`,
          data: {
            user_id: user_data?.dataValues?.UserProfile?.dataValues?.id,
          },
        });
      }
    } catch (err) {
      console.error(err?.message);
      reject(err);
    }
  });
};
