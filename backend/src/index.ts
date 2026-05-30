import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "node:http";
import morgan from "morgan";
import { Server } from "socket.io";
import adminRoutes from "./routes/admin.js";
import aiRoutes from "./routes/ai.js";
import authRoutes from "./routes/auth.js";
import billRoutes from "./routes/bills.js";
import cartRoutes from "./routes/cart.js";
import counterRoutes from "./routes/counter.js";
import exitRoutes from "./routes/exit.js";
import fraudRoutes from "./routes/fraud.js";
import inventoryRoutes from "./routes/inventory.js";
import iotRoutes from "./routes/iot.js";
import paymentRoutes from "./routes/payment.js";
import productRoutes from "./routes/products.js";
import weightRoutes from "./routes/weight.js";
import { setRealtime } from "./services/realtime.js";
import { HttpError } from "./utils/http.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173", "http://localhost:8081"],
    credentials: true
  }
});

setRealtime(io);

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "smart-cart-backend", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/counter", counterRoutes);
app.use("/api/weight", weightRoutes);
app.use("/api/fraud", fraudRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/exit", exitRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/iot", iotRoutes);
app.use("/api/admin", adminRoutes);

io.on("connection", (socket) => {
  socket.on("admin:join", () => socket.join("admin"));
  socket.on("cart:join", (cartId: string) => socket.join(`cart:${cartId}`));
});

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = error instanceof HttpError ? error.status : 500;
  if (status >= 500) console.error(error);
  res.status(status).json({
    success: false,
    error: error.message || "Internal server error"
  });
});

const port = Number(process.env.PORT ?? 4000);
server.listen(port, () => {
  console.log(`Smart Cart backend running on http://localhost:${port}`);
});
