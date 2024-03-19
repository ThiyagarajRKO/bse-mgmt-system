import { UserProfiles, Users } from "../../../../controllers";
import { ChatSignIn } from "../../../../utils/chat/signIn";
import { ChatSignUp } from "../../../../utils/chat/signUp";
import { ValidateUserData } from "../utils/user_validation";

export const SignIn = ({ identity, password }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let user_data = await Users.GetUserAndProfileByIdentifier({
        email: identity,
        phone: identity,
      });

      if (!user_data) {
        return reject({
          message: "User doesn't exists!",
        });
      }

      let user_status = user_data?.user_status;
      let is_mobile_verified = user_data?.is_mobile_verified;
      let is_email_verified = user_data?.is_email_verified;
      let email = user_data?.email;
      let phone = user_data?.phone;
      let username = user_data?.dataValues?.UserProfile?.dataValues?.username;

      await ValidateUserData("signin", user_data, password);

      // Here is we add token into the Cookie
      session.pid = user_data?.dataValues?.UserProfile?.dataValues?.id;

      let full_name = user_data?.dataValues?.UserProfile?.dataValues?.full_name;
      let chat_username =
        user_data?.dataValues?.UserProfile?.dataValues?.chat_username;

      let output_user_data = {
        id: user_data?.dataValues?.UserProfile?.dataValues?.id,
        full_name,
        first_name: user_data?.dataValues?.UserProfile?.dataValues?.first_name,
        last_name: user_data?.dataValues?.UserProfile?.dataValues?.last_name,
        dob: user_data?.dataValues?.UserProfile?.dataValues?.is_dob_public
          ? user_data?.dataValues?.UserProfile?.dataValues?.dob
          : "",
        dob_visible_status:
          user_data?.dataValues?.UserProfile?.dataValues?.is_dob_public,
        country_code: user_data?.country_code,
        is_admin: user_data?.dataValues?.UserProfile?.dataValues?.is_admin,
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

      let chatData = {};
      if (chat_username) {
        chatData = await ChatSignIn(chat_username, process.env.CHAT_USER_PASS);

        if (chatData?.error == "Unauthorized") {
          chatData = await ChatSignUp({
            adminToken: null,
            adminUserId: null,
            name: full_name,
            email: email || `${phone}@piechips.com`,
            username: username.replaceAll("#", "_"),
            password: process.env.CHAT_USER_PASS,
            profile_id: user_data?.dataValues?.UserProfile?.dataValues?.id,
          });
        } else if (
          chatData?.data?.userId !=
          user_data?.dataValues?.UserProfile?.dataValues?.chat_user_id
        ) {
          UserProfiles.Update(
            user_data?.dataValues?.UserProfile?.dataValues?.id,
            {
              chat_user_id: chatData?.data?.userId,
              chat_username: chatData?.data?.me?.username,
            }
          );
        }

        session.chat_token = chatData?.data?.authToken;
        session.chat_user_id = chatData?.data?.userId;
        session.chat_username = chatData?.data?.me?.username;
      }

      resolve({
        data: {
          userdata: output_user_data,
          chat_token: chatData?.data?.authToken,
          chat_user_id: chatData?.data?.userId,
          chat_username: chatData?.data?.me?.username,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
