import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import notesRouter from "./routes/notesRouter";

const app = express();

// Middleware
app.use(express.json());

// Mock authentication middleware
app.use((req: any, res: Response, next: NextFunction) => {
  // Simulate authenticated user
  req.userId = "65a123450001234500012345";
  req.body = {
    ...req.body,
    userId: "65a123450001234500012345", // insert user ID here
  };
  next();
});

// Routes
app.use(notesRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware for hipthrusts handlers (must be after routes)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);

  // Check if it's a Boom error (from @hapi/boom)
  if (err.isBoom) {
    return res.status(err.output.statusCode).json({
      statusCode: err.output.statusCode,
      error: err.output.payload.error,
      message: err.message,
      ...(err.data && { details: err.data }), // Include additional error data if present
    });
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      statusCode: 400,
      error: "Bad Request",
      message: "Validation failed",
      details: Object.values(err.errors).map((e: any) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      statusCode: 400,
      error: "Bad Request",
      message: `Invalid ${err.kind}: ${err.value}`,
    });
  }

  // Handle Zod validation errors
  if (err.name === "ZodError") {
    return res.status(400).json({
      statusCode: 400,
      error: "Bad Request",
      message: "Validation failed",
      details: err.errors.map((e: any) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Default error response
  return res.status(err.status || err.statusCode || 500).json({
    statusCode: err.status || err.statusCode || 500,
    error: err.name || "Internal Server Error",
    message: err.message || "An unexpected error occurred",
  });
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
      const strategy = process.env.VALIDATION_STRATEGY || "zod";
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 Validation Strategy: ${strategy.toUpperCase()}\n`);
      console.log("Available endpoints:");
      console.log("  POST   /notes       - Create a new note");
      console.log("  GET    /notes       - List notes (with pagination, search, sort)");
      console.log("  GET    /notes/:id   - Get a specific note by ID");
      console.log("  PATCH  /notes/:id   - Update a note");
      console.log("  DELETE /notes/:id   - Delete a note");
      console.log("  GET    /health      - Health check\n");
      console.log("💡 Switch validation strategy:");
      console.log("   VALIDATION_STRATEGY=zod npm start");
      console.log("   VALIDATION_STRATEGY=mongoose npm start\n");
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