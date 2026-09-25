import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/category.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: "5mb" }));
app.use(cors({
  origin: true, // allows requests from frontend dev servers (http://localhost:5173, etc.)
  credentials: true
}));

app.get("/healthz", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "SigmaGPT backend is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);
app.use("/api/category", categoryRoutes);


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected with Database!");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (error) {
    console.log("Failed to connect with database", error);
  }
};

connectDB();
