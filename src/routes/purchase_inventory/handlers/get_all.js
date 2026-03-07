import { PurchaseInventory } from "../../../controllers";
import fs from "fs";

export const GetAll = (params, session, fastify) => {
  fs.appendFileSync(
    "/tmp/purchase-inventory-debug.log",
    `[Handler] Received params: ${JSON.stringify(params)}\n`,
  );
  return new Promise(async (resolve, reject) => {
    try {
      const {
        start,
        length,
        "search[value]": search,
        procurement_product_id,
        finished_product_id,
      } = params;
      fs.appendFileSync(
        "/tmp/purchase-inventory-debug.log",
        `[Handler] Extracted: procurement_product_id=${procurement_product_id}, finished_product_id=${finished_product_id}\n`,
      );
      // Creating User
      let purchase_inventory = await PurchaseInventory.GetAll({
        start,
        length,
        search,
        procurement_product_id,
        finished_product_id,
      });

      if (!purchase_inventory) {
        return reject({
          message: "No data found!",
        });
      }

      resolve({
        data: purchase_inventory,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
