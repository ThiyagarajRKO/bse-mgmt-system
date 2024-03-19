import { renderFile } from "ejs";

export const RenderFile = (fileName, templateData) => {
  return new Promise(async (resolve, reject) => {
    try {
      let htmlContent = await renderFile(
        process.cwd() + "/src/routes/client/users/templates/" + fileName,
        templateData,
        {
          async: true,
        }
      );
      resolve(htmlContent);
    } catch (err) {
      reject(err);
    }
  });
};
