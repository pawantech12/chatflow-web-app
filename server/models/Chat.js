import mongoose from "mongoose";
const chatSchema = new mongoose.Schema(
  {
    isGroup: { type: Boolean, default: false },
    name: { type: String, default: null }, // group name or null for private
    groupProfilePic: { type: String, default: null },
    groupDescription: { type: String, default: null },
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
