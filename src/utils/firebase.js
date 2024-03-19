import { Notifications } from "../controllers";
import admin from "firebase-admin";

const serviceAccountMeta = require("../../config/piechips-app-firebase.json");

export const SendPushNotification = ({
  push_receivers,
  push_title,
  push_body,
  push_data,
  push_click_action,
  push_icon,
  push_image,
  push_actions,
}) => {
  return new Promise(async (resolve) => {
    try {
      //checking push token receivers
      if (!push_receivers) {
        return resolve({
          message: "push_receivers param must be an array",
        });
      }

      if (!Array.isArray(push_receivers)) {
        return resolve({
          message: "push_receivers array must NOT be empty",
        });
      }

      // //Getting and FCM Configurations
      // let pushServerKey = process.env.PUSH_SERVER_KEY;

      if (!serviceAccountMeta) {
        return resolve({
          statusCode: 420,
          message: "Firebase Service Account Meta must not be empty",
        });
      }

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountMeta),
        });
      }

      const messages = push_receivers?.map((token) => ({
        notification: {
          title: push_title,
          body: push_body,
        },
        webpush: {
          headers: {
            Urgency: "high",
          },
          notification: {
            icon: push_icon,
            image: push_image,
            actions: push_actions,
            click_action: push_click_action,
          },
        },
        data: push_data,
        token: token,
      }));

      admin.messaging().sendEach(messages).then(resolve).catch(console.log);
    } catch (err) {
      resolve({ message: err });
    }
  });
};

export const SendAndSaveNotification = ({
  push_receivers,
  push_title,
  push_body,
  push_data,
  push_click_action,
  push_icon,
  sender,
  receiver,
  post_id,
  circle_id,
  comment_id,
  comment_thread_id,
  chip_id,
  type,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (sender == receiver) {
        return reject({ message: "Sender and Receiver are same" });
      }

      Notifications.Insert({
        sender,
        receiver,
        notification: push_body,
        post_id,
        comment_id,
        comment_thread_id,
        circle_id,
        chip_id,
        type,
        is_active: true,
      }).catch(reject);

      //checking push token receivers
      if (!Array.isArray(push_receivers) || push_receivers.length == 0) {
        return reject({
          message: "push_receivers param must be an array",
        });
      }

      if (!Array.isArray(push_receivers)) {
        return reject({
          message: "push_receivers array must NOT be empty",
        });
      }

      SendPushNotification({
        push_receivers,
        push_click_action,
        push_title,
        push_body,
        push_icon,
        push_data,
      })
        .then(resolve)
        .catch(console.log);
    } catch (err) {
      console.error(new Date().toISOString() + " : " + err?.message || err);
      reject(err);
    }
  });
};
