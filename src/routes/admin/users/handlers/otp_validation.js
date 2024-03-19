import { Users } from "../../../../controllers";
import { RegisterAndSaveMFA, GetQRCode } from "../utils/totp";
import { VerifyOtp } from "../../../../utils/2factor";
import bcrypt from "bcrypt";

export const ValidateOTP = async ({ user_id, otp, type }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!user_id) {
        return reject({ message: "User must be logged in" });
      }

      if (!otp) {
        return reject({ message: "OTP code must not empty" });
      }

      if (!type) {
        return reject({ message: "Type must not empty" });
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

      if (type == "phone") {
        let data = await VerifyOtp({
          session_id: user_data?.mobile_verify_hash,
          otp,
        });

        if (data?.Status != "Success") {
          return reject({
            message: "Invalid OTP!",
          });
        }

        Users.Update(user_data?.id, { mobile_verify_hash: null });
      } else {
        if (!user_data?.email_verify_hash) {
          return reject({ message: "Invalid OTP" });
        }
        const valid = bcrypt.compareSync(otp, user_data?.email_verify_hash);

        if (!valid) {
          return reject({
            message: "Invalid OTP",
          });
        }

        Users.Update(user_data?.id, { email_verify_hash: null });
      }

      let totp_result = {};

      if (!user_data?.totp_secret) {
        totp_result = await RegisterAndSaveMFA(user_data?.id);
      } else {
        totp_result = await GetQRCode(user_data?.totp_secret);
      }

      session.is_otp_verified = true;

      let data = {};
      if (user_data?.is_mfa_activated) {
        data["is_mfa_activated"] = true;
      } else {
        data["qr_code"] = totp_result?.qrcode;
        data["totp_secret"] = totp_result?.totp_secret;
        data["is_mfa_activated"] = false;
      }

      resolve({
        message: "OTP Verified!",
        data,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
