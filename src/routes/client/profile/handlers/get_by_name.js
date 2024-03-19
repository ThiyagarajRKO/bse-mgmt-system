import { UserProfiles, Notifications } from "../../../../controllers";
import { GetChatPresence } from "../../../../utils/chat/users";

export const GetByName = ({ username, current_profile_id, type }, session) => {
  return new Promise(async (resolve, reject) => {
    try {
      let user_result = await UserProfiles.GetUserWithStatusByProfileId({
        username,
        current_profile_id,
      });

      //profile_id
      let profile_id = user_result.dataValues.id;

      let unread_notifications =
        await Notifications.GetUnreadNotificationsCount({
          profile_id,
        });

      if (!user_result) {
        return reject({ message: "User doesn't exists" });
      }

      let user_chat_status = await GetChatPresence({
        userId: session?.chat_user_id,
        authToken: session?.chat_token,
        userIds: [user_result?.chat_user_id],
      });

      let output_data = {
        user_id: user_result?.dataValues?.id,
        chat_user_id: user_result?.dataValues?.chat_user_id,
        chat_username: user_result?.dataValues?.chat_username,
        chat_user_status: user_chat_status?.users?.[0]?.status || "offline",
        profile_main_info: {
          user_id: user_result?.dataValues?.id || "",
          username: user_result?.dataValues?.username || "",
          profile_name: user_result?.dataValues?.full_name || "",
          first_name: user_result?.dataValues?.first_name || "",
          last_name: user_result?.dataValues?.last_name || "",
          mobile_number: user_result?.dataValues?.User?.dataValues?.phone || "",
          country_code:
            user_result?.dataValues?.User?.dataValues?.country_code || "",
          email: user_result?.dataValues?.User?.dataValues?.email || "",
          dob:
            type == "mine"
              ? user_result?.dataValues?.dob
              : user_result?.dataValues?.is_dob_public
              ? user_result?.dataValues?.dob
              : "",
          dob_visible_status: user_result?.dataValues?.is_dob_public,
          user_status:
            user_result?.dataValues?.User?.dataValues?.user_status || "",
          is_email_verified:
            user_result?.dataValues?.User?.dataValues?.is_email_verified,
          is_mobile_verified:
            user_result?.dataValues?.User?.dataValues?.is_mobile_verified,
        },
        profile_other_info: {
          unread_notifications: unread_notifications,
          total_stars: user_result?.dataValues?.total_stars,
          is_user_blocked: user_result?.dataValues?.is_this_user_blocked,
          loggedInUser_person_follow_status:
            type == "mine"
              ? null
              : user_result?.dataValues?.current_user_follow_status,
          total_followers_count: user_result?.dataValues?.total_followers || 0,
          total_following_count: user_result?.dataValues?.total_following || 0,
          current_position_type:
            user_result?.dataValues?.current_position_type || "",
          current_position_value1:
            user_result?.dataValues?.current_position_value1 || "",
          current_position_value2:
            user_result?.dataValues?.current_position_value2 || "",
          user_about_info: user_result?.dataValues?.info || "",
          user_place: user_result?.dataValues?.place || "",
          user_appearance_image_file:
            user_result?.dataValues?.appearance_url || "",
        },
        profile_websites_info: user_result?.dataValues?.website_info || [],
        avatar_info: {
          avatar_main_url: user_result?.dataValues?.avatar_main_url,
          avatar_small_url: user_result?.dataValues?.avatar_small_url,
          avatar_bg_color: user_result?.dataValues?.avatar_bg_color,
          avatar_view_type: user_result?.dataValues?.avatar_view_type,
          avatar_glb_id: user_result?.dataValues?.avatar_glb_id,
          avatar_type: user_result?.dataValues?.avatar_type,
        },
        chat_info: {
          chat_user_id: user_result?.dataValues?.chat_user_id,
          chat_username: user_result?.dataValues?.chat_username,
          chat_user_status: user_chat_status?.users?.[0]?.status || "offline",
        },
        current_user_followers_info: user_result?.dataValues?.followers,
        current_user_following_info: user_result?.dataValues?.following,
      };
      resolve({ data: output_data });
    } catch (err) {
      reject(err);
    }
  });
};
