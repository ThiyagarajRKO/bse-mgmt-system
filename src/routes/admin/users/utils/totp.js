import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { Users } from "../../../../controllers";

export const RegisterMFA = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const secretCode = speakeasy.generateSecret();

      let url = speakeasy.otpauthURL({
        secret: secretCode.base32,
        label: `Admin`,
        issuer: "Piechips",
        encoding: "base32",
      });

      let qr_code_data = await qrcode.toDataURL(url);

      resolve({ qrcode: qr_code_data, totp_secret: secretCode.base32, url });
    } catch (err) {
      reject(err);
    }
  });
};

export const GetQRCode = (secret) => {
  return new Promise(async (resolve, reject) => {
    try {
      let url = speakeasy.otpauthURL({
        secret,
        label: `Admin`,
        issuer: "Piechips",
        encoding: "base32",
      });

      let qr_code_data = await qrcode.toDataURL(url);

      resolve({ qrcode: qr_code_data, totp_secret: secret });
    } catch (err) {
      reject(err);
    }
  });
};

export const RegisterAndSaveMFA = (user_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      let result = await RegisterMFA();

      resolve({ qrcode: result?.qrcode, totp_secret: result?.qrcode });

      Users.Update(user_id, {
        totp_secret: result.totp_secret,
        qr_code_url: result?.url,
      });
    } catch (err) {
      reject(err);
    }
  });
};

export const ValidateMFA = ({ secret, token }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let verified = speakeasy.totp.verify({
        secret,
        encoding: "base32",
        token,
      });
      resolve(verified);
    } catch (err) {
      reject(err);
    }
  });
};
