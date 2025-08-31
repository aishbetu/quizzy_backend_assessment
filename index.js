import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./database/db.js";
import authRoute from "./routes/authRoute.js";
import skillRoute from "./routes/skillRoute.js";
import questionRoute from "./routes/questionRoute.js";
import attemptRoutes from "./routes/attemptRoute.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Sync database and create tables if not exist
(async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log("✅ Database synced (tables ready).");
    } catch (error) {
        console.error("❌ Error syncing DB:", error);
    }
})();

app.use("/api/auth", authRoute);
app.use("/api/skill", skillRoute);
app.use("/api/questions", questionRoute);
app.use("/api/attempts", attemptRoutes);



app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to the Quizzy API" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
