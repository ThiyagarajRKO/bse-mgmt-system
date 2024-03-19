import dotenv from "dotenv";
dotenv.config()

const giveMeConnectionString = () => {
    let connString;
    if (process.env.NODE_ENV === "production") {
        connString = {
            host: process.env.PROD_DB_HOST,
            user: process.env.PROD_DB_USER_NAME,
            password: process.env.PROD_DB_SECRET,
            database: process.env.PROD_DB,
            port: process.env.PROD_DB_PORT
        };
    } else if (process.env.NODE_ENV === "staging") {
        connString = {
            host: process.env.STAGE_DB_HOST,
            user: process.env.STAGE_DB_USER_NAME,
            password: process.env.STAGE_DB_SECRET,
            database: process.env.STAGE_DB,
            port: process.env.STAGE_DB_PORT
        };
    } else {
        connString = {
            host: process.env.LOCAL_DB_HOST,
            user: process.env.LOCAL_DB_USER_NAME,
            password: process.env.LOCAL_DB_SECRET,
            database: process.env.LOCAL_DB,
            port: process.env.LOCAL_DB_PORT
        };
    }
    return connString;
}


export {
    giveMeConnectionString
}  