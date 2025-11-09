import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, default: "" },
    reactions: [
      {
        emoji: { type: String },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
    ],
    fileUrl: { type: String }, // ✅ add this
    fileType: { type: String }, // ✅ image / video / raw
    filePublicId: String,
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isEdited: { type: Boolean, default: false }, // 👈 add this
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
