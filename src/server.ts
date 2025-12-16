import express, { Request, Response, NextFunction, RequestHandler } from "express";
import mongoose from "mongoose";
import { hipExpressHandlerFactory } from "hipthrusts";
import { CreateNoteHandlerUsingMongoose } from "./handlers/usingMongoose/createNote";
import { CreateNoteHandlerUsingZod } from "./handlers/usingZod/createNote";

const app = express();

// Middleware
app.use(express.json());

// Mock authentication middleware
app.use((req: any, res: Response, next: NextFunction) => {
  // Simulate authenticated user
  req.userId= "65a123450001234500012345" ;
  req.body = {
    ...req.body,
    userId: "65a123450001234500012345"   // insert user ID here
  };
  next();
});

// Error handling middleware for hipthrusts handlers
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});


const handler = hipExpressHandlerFactory(CreateNoteHandlerUsingZod)

// Routes

app.post("/notes", handler);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 3000;
// For WSL: Use Windows host IP. Get it with: cat /etc/resolv.conf | grep nameserver
// Example: mongodb://172.24.32.1:27017/hipnotes
const MONGO_URI = process.env.MONGO_URI || "mongodb://172.25.224.1:27017/hipnotes";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✓ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`POST /notes - Create a new note`);
      console.log(`GET /health - Health check`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    console.error("\nIf running in WSL with MongoDB on Windows:");
    console.error("1. Get Windows host IP: cat /etc/resolv.conf | grep nameserver");
    console.error("2. Set MONGO_URI=mongodb://<windows-ip>:27017/hipnotes");
    console.error("3. Ensure MongoDB on Windows binds to 0.0.0.0 (not just 127.0.0.1)");
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});