import { Users, UserProfiles } from "../../../controllers";

export const SignUp = ({
  username,
  full_name,
  first_name,
  last_name,
  password,
  email = "",
  phone = "",
  dob,
  country_code,
  role_id,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
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

      if (!user_data) {
        is_new_account = true;
        user_data = await Users.Insert({
          password,
          is_email_verified: false,
          is_mobile_verified: false,
          user_status: "0",
          username,
          email,
          phone,
          country_code,
          is_active: true,
        });

        profile_data = await UserProfiles.Insert({
          full_name,
          first_name,
          last_name,
          role_id,
          dob,
          is_admin: false,
          is_active: true,
          created_by: user_data?.id,
          updated_by: user_data?.id,
        });

        user_data.profile_data = profile_data;
      }

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
          message: `Account exists already!`,
          data: {
            user_id: user_data?.UserProfile?.id,
          },
        });
      }
    } catch (err) {
      console.error(err?.message);
      reject(err);
    }
  });
};
