import { UserProfiles } from "../../../controllers";

export const Update = ({
  full_name, //temp
  first_name,
  last_name,
  profile_id,
  user_about_info,
  user_place,
  current_position_type,
  current_position_value1,
  current_position_value2,
  dob,
  website_info,
  appearance_url,
  avatar_main_url,
  avatar_small_url,
  avatar_bg_color,
  avatar_glb_id,
  avatar_type,
  avatar_view_type,
  dob_visible_status,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let input_data = {
        dob,
        full_name, // temp
        first_name,
        last_name,
        info: user_about_info,
        place: user_place,
        current_position_type,
        current_position_value1,
        current_position_value2,
        appearance_url,
        website_info,
        avatar_main_url,
        avatar_small_url,
        avatar_bg_color,
        avatar_glb_id,
        avatar_type,
        avatar_view_type,
        is_dob_public: dob_visible_status,
      };

      let post_result = await UserProfiles.Update(profile_id, input_data);

      if (post_result?.[0] > 0) {
        resolve({ message: "Profile data has been updated successfully!" });
      } else {
        reject({ message: "Please check the profile id!" });
      }
    } catch (err) {
      reject(err);
    }
  });
};
