import { Users } from "../../../../controllers";
import { RegisterAndSaveMFA } from "../utils/totp";
import bcrypt from "bcrypt";
import { SendOtp } from "../../../../utils/2factor";
import { SendMail } from "../../../../utils/sendInBlue";
import otpGenerator from "otp-generator";

export const SignIn = async ({ identity, password }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let user_data = await Users.GetUserAndProfileByIdentifier({
        email: identity,
        phone: identity,
        userType: "Admin",
      });

      if (!user_data) {
        return reject({
          message: "User doesn't exists!",
        });
      }

      if (!password || !user_data?.password) {
        return reject({
          message: "Password shouldn't empty!",
        });
      }

      //console.log(password, userExists.password);
      const valid = bcrypt.compareSync(password, user_data?.password);
      if (!valid) {
        return reject({
          message: "Invalid credential",
        });
      }

      session.uid = user_data?.id;

      if (!identity.includes("@") && user_data?.phone) {
        let otpStatus = await SendOtp({
          phone: user_data?.phone,
          otp_template: "Piechips",
        });

        if (otpStatus?.Details)
          Users.Update(user_data?.id, {
            mobile_verify_hash: otpStatus?.Details,
          });
      } else {
        let otp = otpGenerator.generate(6, {
          lowerCaseAlphabets: false,
          upperCaseAlphabets: false,
          specialChars: false,
        });
        let result = await SendMail({
          subject: "Verification Email",
          htmlContent: `Your OTP is <b>${otp}</b>`,
          receiver_name:
            user_data?.dataValues?.UserProfile?.dataValues?.full_name,
          receiver_email: user_data?.dataValues?.email,
        });

        if (result)
          Users.Update(user_data?.dataValues?.id, {
            email_verify_hash: bcrypt.hashSync(otp, bcrypt.genSaltSync(10)),
          });
      }

      resolve({
        message: "OTP triggered successfully",
        // data: {
        //   user_id: user_data?.id,
        // },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
