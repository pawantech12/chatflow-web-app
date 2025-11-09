import express from "express";
const router = express.Router();
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import auth from "../middleware/auth.js";
import upload from "../middleware/uploadMiddleware.js";
import cloudinary from "../config/cloudinary.js";

// Create or get 1-1 chat
// POST /api/chats/private  { otherUserId }
router.post("/private", auth, async (req, res) => {
  try {
    const { otherUserId } = req.body;
    if (!otherUserId)
      return res.status(400).json({ message: "otherUserId required" });

    // Check existing chat
    let chat = await Chat.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, otherUserId], $size: 2 },
    })
      .populate("participants", "-password")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name avatar" },
      });

    if (chat) return res.json(chat);

    // Create new chat
    chat = await Chat.create({
      participants: [req.user._id, otherUserId],
      isGroup: false,
    });
    chat = await Chat.findById(chat._id)
      .populate("participants", "-password")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name avatar" },
      });
    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete 1-1 chat
// DELETE /api/chats/private/:chatId -> delete a 1-to-1 chat and its messages
router.delete("/private/:chatId", auth, async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat || chat.isGroup)
      return res.status(404).json({ message: "Private chat not found" });

    // Ensure the user is one of the participants
    if (!chat.participants.includes(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this chat" });
    }

    // Delete all messages associated with this chat
    await Message.deleteMany({ chat: chatId });

    // Delete the chat itself
    await Chat.findByIdAndDelete(chatId);
    // ✅ Emit real-time update to all participants
    for (let participant of chat.participants) {
      req.io?.to(`user:${participant}`).emit("chatDeleted", { chatId });
    }
    res.json({ message: "Private chat deleted successfully" });
  } catch (err) {
    console.error("Error deleting private chat:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create group chat
// POST /api/chats/group { name, participantIds: [] }
router.post(
  "/group",
  auth,
  upload.single("groupProfilePic"),
  async (req, res) => {
    try {
      const { name, participantIds, description } = req.body || {};

      console.log("🧩 Raw body:", req.body);

      // ✅ Safe type check and trim
      const groupName =
        typeof name === "string" ? name.trim() : String(name || "").trim();

      // ✅ FIX: parse participantIds if it's a JSON string
      let parsedParticipants;
      try {
        parsedParticipants =
          typeof participantIds === "string"
            ? JSON.parse(participantIds)
            : participantIds;
      } catch (e) {
        parsedParticipants = [];
      }

      if (
        !groupName ||
        !Array.isArray(parsedParticipants) ||
        parsedParticipants.length < 1
      ) {
        console.log("❌ Invalid input:", { groupName, participantIds });
        return res.status(400).json({ message: "Invalid input" });
      }

      const participants = [
        ...new Set([req.user._id.toString(), ...parsedParticipants]),
      ];

      let uploadedImage = null;
      if (req.file) {
        // ✅ Upload to Cloudinary
        const buffer = req.file.buffer;
        uploadedImage = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "chat_app/group_pics" },
            (error, result) => {
              if (error) {
                console.error("❌ Cloudinary upload failed:", error);
                return reject(error);
              }
              resolve(result);
            }
          );
          stream.end(buffer);
        });
      }

      const chat = await Chat.create({
        isGroup: true,
        name: groupName,
        groupDescription: description?.trim() || null,
        groupProfilePic: uploadedImage?.secure_url || null,
        participants,
        createdBy: req.user._id,
      });

      const populated = await Chat.findById(chat._id).populate(
        "participants",
        "-password"
      );

      // Emit event to all members
      populated.participants.forEach((p) => {
        req.io?.to(`user:${p._id}`).emit("newGroupCreated", populated);
      });

      res.status(201).json(populated);
    } catch (err) {
      console.error("💥 Create group error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// GET /api/chats/ -> list chats for user
router.get("/", auth, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate("participants", "-password")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name avatar" },
      })
      .sort({ updatedAt: -1 });

    // Add unread count for each chat
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unread = await Message.countDocuments({
          chat: chat._id,
          readBy: { $ne: req.user._id },
        });
        return { ...chat.toObject(), unread };
      })
    );

    res.json(chatsWithUnread);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/chats/:chatId/messages -> recent messages
router.get("/:chatId/messages", auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name avatar")
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "name avatar" }, // nested populate for reply sender
      })
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/chats/group/:chatId
router.delete("/group/:chatId", auth, async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Only the group creator can delete it
    if (chat.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this group." });
    }

    // Find all messages related to this group
    const messages = await Message.find({ chat: chatId });

    // Delete all associated Cloudinary files (if any)
    for (const msg of messages) {
      if (msg.fileUrl) {
        try {
          // Extract public_id from Cloudinary URL
          const publicId = msg.filePublicId;

          await cloudinary.uploader.destroy(publicId, {
            resource_type: "auto",
          });
        } catch (err) {
          console.warn("Cloudinary delete failed:", err.message);
        }
      }
    }

    // Delete all related messages
    await Message.deleteMany({ chat: chatId });

    // Delete the chat itself
    await Chat.findByIdAndDelete(chatId);
    // ✅ Emit event to all participants individually

    for (let participant of chat.participants) {
      req.io?.to(`user:${participant}`).emit("groupDeleted", { chatId });
    }

    res.json({ message: "Group deleted successfully" });
  } catch (err) {
    console.error("Error deleting group:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/chats/group/:id/leave
router.patch("/group/:chatId/leave", auth, async (req, res) => {
  try {
    const chatId = req.params.chatId;

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup)
      return res.status(404).json({ message: "Group not found" });

    // Check if user is in group
    if (!chat.participants.includes(req.user._id)) {
      return res.status(400).json({ message: "You are not in this group" });
    }

    // Remove user from group
    chat.participants = chat.participants.filter(
      (id) => id.toString() !== req.user._id.toString()
    );

    if (chat.participants.length === 0) {
      await Chat.findByIdAndDelete(chatId);
      return res.json({ message: "Group deleted because no members are left" });
    }

    await chat.save();

    res.json({ message: "You Left group successfully", chat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/chats/group/:chatId/add-member
router.patch("/group/:chatId/add-member", auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { newMemberIds } = req.body; // array of user IDs to add

    if (!Array.isArray(newMemberIds) || newMemberIds.length === 0) {
      return res.status(400).json({ message: "No members provided to add" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Only group creator can add members (optional rule)
    if (chat.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only group creator can add members" });
    }

    // Add new members, avoiding duplicates
    const updatedParticipants = Array.from(
      new Set([...chat.participants.map(String), ...newMemberIds])
    );
    chat.participants = updatedParticipants;

    await chat.save();

    const updatedChat = await Chat.findById(chatId).populate(
      "participants",
      "name email"
    );

    res.json({
      message: "Members added successfully",
      chat: updatedChat,
    });
  } catch (err) {
    console.error("Error adding members:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
