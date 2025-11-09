import express from "express";
const router = express.Router();
import Message from "../models/Message.js";
import auth from "../middleware/auth.js";
import Chat from "../models/Chat.js";
import upload from "../middleware/uploadMiddleware.js";
import cloudinary from "../config/cloudinary.js";

// Time limit (5 minutes = 300000 ms)
const EDIT_DELETE_TIME_LIMIT = 5 * 60 * 1000;

// PUT /api/messages/:id/read   -> mark message read by current user
router.put("/:id/read", auth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    if (!msg.readBy.some((r) => r.toString() === req.user._id.toString())) {
      msg.readBy.push(req.user._id);
      await msg.save();
    }
    res.json(msg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/messages/:id/edit -> edit message (within 5 min)
router.patch("/:id/edit", auth, async (req, res) => {
  try {
    const { newText } = req.body;
    if (!newText) return res.status(400).json({ message: "Text required" });

    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    // Only sender can edit
    if (msg.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Time limit check
    const diff = Date.now() - new Date(msg.createdAt).getTime();
    if (diff > EDIT_DELETE_TIME_LIMIT) {
      return res
        .status(400)
        .json({ message: "Edit window has expired (5 min limit)" });
    }

    msg.text = newText;
    msg.isEdited = true;
    await msg.save();

    // Update chat's lastMessage if this was the lastMessage
    const chat = await Chat.findById(msg.chat);
    if (chat.lastMessage.toString() === msg._id.toString()) {
      chat.lastMessage = msg._id;
      await chat.save();
    }

    // populate message sender and other too
    const populated = await Message.findById(msg._id)
      .populate("sender", "name avatar")
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "name avatar" }, // nested populate for reply sender
      });

    // Emit socket event for live update
    req.io?.to(`chat:${chat._id}`).emit("messageUpdated", populated);

    // Emit to participants for sidebar
    for (let p of chat.participants) {
      const unreadCount = await Message.countDocuments({
        chat: chat._id,
        readBy: { $ne: p },
      });

      req.io?.to(`user:${p}`).emit("newChatMessage", {
        chatId: chat._id,
        lastMessage: populated,
        unreadCount,
      });
    }

    res.json({ message: "Message updated", msg: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// finding last message of the chat
router.get("/:chatId/lastMessage", async (req, res) => {
  try {
    const lastMessage = await Message.find({ chat: req.params.chatId })
      .sort({ createdAt: -1 })
      .limit(1)
      .populate("sender", "name avatar")
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "name avatar" }, // nested populate for reply sender
      });
    res.json(lastMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/messages/:id/delete -> delete own message (within 5 min)
router.delete("/:id/delete", auth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    // Only sender can delete
    if (msg.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // ✅ Delete file from Cloudinary using stored public_id and resource type
    if (msg.filePublicId) {
      try {
        // Detect Cloudinary resource type
        let resourceType = "auto";
        if (msg.fileType.startsWith("image")) resourceType = "image";
        else if (msg.fileType.startsWith("video")) resourceType = "video";
        else resourceType = "raw"; // pdf, docx, zip, etc.

        const result = await cloudinary.uploader.destroy(msg.filePublicId, {
          resource_type: resourceType,
        });

        console.log("✅ Cloudinary deletion result:", result);
      } catch (err) {
        console.error("❌ Cloudinary deletion failed:", err.message);
      }
    }

    await msg.deleteOne();

    // Update chat lastMessage
    const chat = await Chat.findById(msg.chat);
    const lastMsg = await Message.find({ chat: chat._id })
      .sort({ createdAt: -1 })
      .limit(1);

    chat.lastMessage = lastMsg[0]?._id || null;
    await chat.save();

    // Populate lastMessage for sidebar
    const populatedLastMessage = lastMsg[0]
      ? await Message.findById(lastMsg[0]._id).populate("sender", "name avatar")
      : { text: "No messages yet" };

    // Emit to participants
    for (let p of chat.participants) {
      const unreadCount = await Message.countDocuments({
        chat: chat._id,
        readBy: { $ne: p },
      });

      req.io?.to(`user:${p}`).emit("newChatMessage", {
        chatId: chat._id,
        lastMessage: populatedLastMessage,
        unreadCount,
      });
    }

    // Emit socket event for live deletion
    req.io?.to(`chat:${chat._id}`).emit("messageDeleted", {
      messageId: msg._id,
    });

    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/messages/:messageId/pin
router.patch("/:messageId/pin", auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId).populate("chat");

    if (!message) return res.status(404).json({ message: "Message not found" });

    const chat = await Chat.findById(message.chat._id);
    if (!chat.isGroup)
      return res
        .status(400)
        .json({ message: "Only group chats allow pinning" });

    // ✅ only group creator can pin messages
    if (chat.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only group admin can pin messages" });
    }

    message.isPinned = !message.isPinned;
    await message.save();

    // Notify group members in real time if needed
    req.io?.to(chat._id.toString()).emit("messagePinned", {
      messageId,
      isPinned: message.isPinned,
    });

    res.json({
      message: `Message ${
        message.isPinned ? "pinned" : "unpinned"
      } successfully`,
      data: message,
    });
  } catch (err) {
    console.error("Pin message error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/messages/:id/react
router.post("/:id/react", auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    const messageId = req.params.id;
    const userId = req.user._id;

    let message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    let reaction = message.reactions.find((r) => r.emoji === emoji);

    if (reaction) {
      // Toggle reaction
      if (reaction.users.includes(userId)) {
        reaction.users.pull(userId);
      } else {
        reaction.users.push(userId);
      }
    } else {
      message.reactions.push({ emoji, users: [userId] });
    }

    await message.save();

    // Populate sender for frontend display
    message = await Message.findById(messageId).populate(
      "reactions.users",
      "name avatar"
    );

    // Emit via socket
    req.io.to(message.chat.toString()).emit("reactionUpdated", message);

    res.status(200).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add reaction" });
  }
});

// POST /api/messages/send
router.post("/send", auth, upload.single("file"), async (req, res) => {
  try {
    const { chatId, text, replyTo } = req.body;
    const file = req.file;

    if (!chatId && !text && !file)
      return res.status(400).json({ error: "Invalid message" });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    let uploadedFile = null;

    if (file) {
      // ✅ Properly wrap Cloudinary upload in a Promise
      uploadedFile = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "chat_uploads", resource_type: "auto" },
          (error, result) => {
            if (error) return reject(error);
            resolve({
              url: result.secure_url,
              type: file.mimetype,
              public_id: result.public_id,
            });
          }
        );
        stream.end(file.buffer);
      });
    }

    const message = await Message.create({
      chat: chat._id,
      sender: req.user._id,
      text: text || "",
      fileUrl: uploadedFile?.url || "",
      fileType: uploadedFile?.type || "",
      filePublicId: uploadedFile?.public_id || "",
      replyTo: replyTo || null,
      readBy: [req.user._id],
    });

    chat.lastMessage = message._id;
    await chat.save();

    const populatedChat = await Chat.findById(chat._id)
      .populate("participants", "-password")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name avatar" },
      });

    // Notify all participants (except sender)
    for (let participant of populatedChat.participants) {
      if (participant._id.toString() !== req.user._id.toString()) {
        req.io
          ?.to(`user:${participant._id}`)
          .emit("newChatCreated", populatedChat);
      }
    }

    res.status(201).json({ message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// GET /api/messages/search?query=hello&chatId=123
router.get("/search", auth, async (req, res) => {
  try {
    const { query, chatId } = req.query;

    if (!query || query.trim().length < 1) {
      return res.status(400).json({ message: "Search query required" });
    }

    // Validate chatId
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Ensure user is part of this chat
    if (!chat.participants.includes(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to search this chat" });
    }

    // Case-insensitive search only within this chat
    const messages = await Message.find({
      chat: chatId,
      text: { $regex: query, $options: "i" },
    })
      .populate("chat", "name isGroup participants")
      .populate("sender", "name avatar email")
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "name avatar" },
      })
      .limit(50);

    res.json(messages);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
