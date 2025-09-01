import dotenv from "dotenv";
import { Sequelize } from "sequelize";
import mysql2 from "mysql2";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    dialectModule: mysql2,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

if (process.env.NODE_ENV !== 'production'){
(async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ MySQL connection established successfully.");
    } catch (error) {
        console.error("❌ MySQL connection failed:", error);
    }
})();
}

export default sequelize;
