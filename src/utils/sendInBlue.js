import SibApiV3Sdk from "sib-api-v3-sdk";

SibApiV3Sdk.ApiClient.instance.authentications["api-key"].apiKey =
  process.env.SENDINBLUE_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

export const SendMail = ({
  subject,
  htmlContent,
  receiver_name,
  receiver_email,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let options = {
        subject,
        htmlContent,
        sender: {
          name: process.env.SENDER_NAME,
          email: process.env.SENDER_EMAIL,
        },
        to: [
          {
            email: receiver_email,
            name: receiver_name,
          },
        ],
        replyTo: {
          email: process.env.REPLY_EMAIL,
          name: process.env.REPLY_NAME,
        },
      };

      const result = await apiInstance.sendTransacEmail(options);
      console.log("Email has been sent successfully");

      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};
