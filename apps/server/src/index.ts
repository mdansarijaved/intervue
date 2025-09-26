import "dotenv/config";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "./lib/context";
import { appRouter } from "./routers/index";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3001",
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3001",
    methods: ["GET", "POST", "OPTIONS"],
  })
);

const createContextWithSocket = (opts: any) => {
  return { ...createContext(opts), io };
};

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: createContextWithSocket,
  })
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-poll", (pollId: string) => {
    socket.join(`poll:${pollId}`);
    console.log(`Socket ${socket.id} joined poll:${pollId}`);
  });

  socket.on("leave-poll", (pollId: string) => {
    socket.leave(`poll:${pollId}`);
    console.log(`Socket ${socket.id} left poll:${pollId}`);
  });

  socket.on("join-teacher", () => {
    socket.join("teacher");
    console.log(`Socket ${socket.id} joined teacher room`);
  });

  socket.on("join-chat", () => {
    socket.join("chat");
    console.log(`Socket ${socket.id} joined chat room`);
  });

  socket.on(
    "chat-message",
    (msg: { id: string; user: string; text: string; timestamp: number }) => {
      io.to("chat").emit("chat-message", msg);
    }
  );

  socket.on("join-student-room", (data: { studentName: string }) => {
    socket.join("students");
    console.log(
      `Socket ${socket.id} (${data.studentName}) joined student room`
    );
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
