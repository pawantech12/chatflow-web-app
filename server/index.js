import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import chatRoutes from "./routes/chats.js";
import messageRoutes from "./routes/messages.js";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Chat from "./models/Chat.js";
import Message from "./models/Message.js";
import { Server } from "socket.io";

const PORT = process.env.PORT || 3000;
const MONGO = process.env.MONGODB_URI;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://192.168.0.106:3000";

connectDB(MONGO);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use((req, res, next) => {
  req.io = io; // attach io instance
  next();
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

// health
app.get("/api/health", (req, res) => res.json({ ok: true }));

/**
 * Socket.IO Authentication:
 * Client should connect with: io(SERVER_URL, { auth: { token } })
 * where token is the JWT returned from login/register.
 */
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];
    if (!token) return next(new Error("Authentication error"));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select("-password");
    if (!user) return next(new Error("Authentication error - user not found"));
    socket.user = user;
    next();
  } catch (err) {
    console.error("Socket auth error", err);
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected", socket.user.email, socket.id);

  // Mark user online
  User.findByIdAndUpdate(socket.user._id, { status: "online" }, { new: true })
    .then(() => {
      // Broadcast to all that user is online
      io.emit("userStatusUpdate", {
        userId: socket.user._id,
        status: "online",
      });
    })
    .catch(() => {});
  // Join personal room for direct events
  socket.join(`user:${socket.user._id}`);

  // When client wants to join a chat room
  socket.on("joinRoom", async ({ chatId }) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return;
      // Only allow participants
      if (
        !chat.participants.some(
          (p) => p.toString() === socket.user._id.toString()
        )
      )
        return;
      socket.join(`chat:${chatId}`);
      console.log(`${socket.user.email} joined chat:${chatId}`);
    } catch (err) {
      console.error(err);
    }
  });

  // sendMessage: store message and emit to room
  // payload: { chatId, text, mediaUrl }
  socket.on("sendMessage", async (message, ack) => {
    try {
      // message should already be saved via REST API
      const { chat: chatId, _id: messageId } = message || {};
      if (!chatId || !messageId)
        return ack && ack({ error: "Invalid message payload" });

      const chat = await Chat.findById(chatId).populate(
        "participants",
        "-password"
      );
      if (!chat) return ack && ack({ error: "Chat not found" });

      if (
        !chat.participants.some(
          (p) => p._id.toString() === socket.user._id.toString()
        )
      )
        return ack && ack({ error: "Not a participant" });

      // populate message for emit
      const populatedMessage = await Message.findById(messageId)
        .populate("sender", "name avatar")
        .populate({
          path: "replyTo",
          populate: { path: "sender", select: "name avatar" },
        });

      // populate chat's lastMessage before emitting
      const updatedChat = await Chat.findById(chatId).populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name avatar" },
      });

      // emit to chat room
      io.to(`chat:${chatId}`).emit("newMessage", populatedMessage);

      // Emit to participants for sidebar with unread counts
      for (let p of chat.participants) {
        const unreadCount =
          p._id.toString() === socket.user._id.toString()
            ? 0
            : await Message.countDocuments({
                chat: chatId,
                readBy: { $ne: p._id },
              });

        io.to(`user:${p._id}`).emit("newChatMessage", {
          chatId,
          lastMessage: updatedChat.lastMessage,
          unreadCount,
        });
      }

      if (ack) ack({ ok: true, message: populatedMessage });
    } catch (err) {
      console.error("sendMessage error", err);
      if (ack) ack({ error: "Server error" });
    }
  });

  socket.on("addReaction", async ({ messageId, emoji, userId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      // Find if reaction for this emoji already exists
      let reaction = message.reactions.find((r) => r.emoji === emoji);

      if (reaction) {
        // Add userId if not already in users array
        if (!reaction.users.includes(userId)) {
          reaction.users.push(userId);
        } else {
          // Optional: remove reaction if user clicks again
          reaction.users.pull(userId);
        }
      } else {
        // Add new reaction with this emoji
        message.reactions.push({ emoji, users: [userId] });
      }

      await message.save();

      const populated = await Message.findById(messageId)
        .populate("sender", "name avatar")
        .populate({
          path: "replyTo",
          populate: { path: "sender", select: "name avatar" },
        });

      io.to(`chat:${message.chat.toString()}`).emit(
        "reactionUpdated",
        populated
      );
    } catch (err) {
      console.error("addReaction error", err);
    }
  });

  // typing indicator: { chatId, typing: true/false }
  socket.on("typing", ({ chatId, typing }) => {
    if (!chatId) return;
    socket
      .to(`chat:${chatId}`)
      .emit("typing", { chatId, userId: socket.user._id, typing: !!typing });
  });

  // mark message as read: { messageId, chatId }
  // In socket connection
  socket.on("markRead", async ({ chatId }) => {
    try {
      const messages = await Message.find({
        chat: chatId,
        readBy: { $ne: socket.user._id },
      });

      for (let msg of messages) {
        msg.readBy.push(socket.user._id);
        await msg.save();
      }

      // Notify all participants in the chat
      io.to(`chat:${chatId}`).emit("messagesRead", {
        chatId,
        userId: socket.user._id,
      });

      // Update sidebar for all participants
      const chat = await Chat.findById(chatId).populate("participants", "_id");
      // Update sidebar unread count for all participants
      for (let participant of chat.participants) {
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          readBy: { $ne: participant._id },
        });

        io.to(`user:${participant._id}`).emit("chatReadUpdate", {
          chatId: chat._id,
          unreadCount,
        });
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected", socket.user?.email, socket.id);
    // mark offline (simple approach — in production, handle multiple sockets per user)
    User.findByIdAndUpdate(socket.user._id, { status: "offline" })
      .then(() => {
        // Broadcast to everyone that user is offline
        io.emit("userStatusUpdate", {
          userId: socket.user._id,
          status: "offline",
        });
      })
      .catch(() => {});
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
