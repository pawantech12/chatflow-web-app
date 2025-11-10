"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  EllipsisVertical,
  FileText,
  Loader2,
  LogOut,
  Mic,
  Paperclip,
  Search,
  Send,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import axios from "axios";
import { useSocket } from "@/contexts/socketContext";
import { GroupMembersModal } from "./GroupMembersModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { AddMembersModal } from "./AddMembersModal";
import Picker from "@emoji-mart/react";
import Link from "next/link";
import Image from "next/image";

export function MessageArea({
  conversationId,
  conversationName,
  conversationProfile,
  conversationDescription,
  isGroup,
  conversationMembers,
  createdBy,
  onChatDeleted,
  onBack,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState(null);

  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();
  const messagesEndRef = useRef(null);
  const socket = useSocket();
  const [isTyping, setIsTyping] = useState(false); // typing indicator state
  const [typingUsers, setTypingUsers] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);

  // inside component
  const [showMembers, setShowMembers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  const [showDeleteChatModal, setShowDeleteChatModal] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null); // messageId or null
  const [file, setFile] = useState(null); // selected file
  const [filePreview, setFilePreview] = useState(null); // preview URL
  const [imageModal, setImageModal] = useState({
    open: false,
    src: null,
  });
  const [dragOver, setDragOver] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const resultsRef = useRef(null);

  const pageSize = 20; // messages per page

  // 👇 Add this near top of MessageArea component (after const typingTimeout = useRef(null))
  const messageRefs = useRef({});

  // Helper function to scroll to a message smoothly
  const scrollToMessage = (id, direction = "down") => {
    const refObj = messageRefs.current[id];
    const el = refObj?.current || null;
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: direction === "up" ? "start" : "end",
      });
      // optional highlight
      el.classList.add("ring-2", "ring-indigo-200", "transition");
      setTimeout(() => el.classList?.remove("ring-2", "ring-indigo-200"), 1500);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    console.log("Selected file:", selected);

    setFile(selected);

    const reader = new FileReader();
    reader.onload = (e) => {
      console.log("File base64:", e.target.result); // <-- check here
      setFilePreview(e.target.result);
    };
    reader.readAsDataURL(selected);
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setSelectedIndex(-1);
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.get(
        `${API_URL}/api/messages/search?query=${encodeURIComponent(
          query
        )}&chatId=${conversationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSearchResults(data);
      setShowResults(true);
      if (data.length > 0) {
        setSelectedIndex(0);
        scrollToMessage(data[0]._id);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
  };
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioURL(url);
      };

      recorder.start();
      setRecording(true);
      setMediaRecorder(recorder);
    } catch (err) {
      toast.error("Microphone access denied or not supported.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const typingTimeout = useRef(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!conversationId || !socket) return;

    // Mark messages as read when opening the chat
    socket.emit("markRead", { chatId: conversationId });

    // Join chat room
    socket.emit("joinRoom", { chatId: conversationId });

    const handleNewMessage = (message) => {
      if (
        message.chat === conversationId ||
        message.chat?._id === conversationId
      ) {
        setMessages((prev) => [...prev, message]);
        // Mark as read immediately
        socket.emit("markRead", { chatId: conversationId });
      }
    };

    socket.on("newMessage", handleNewMessage);

    socket.on("messageUpdated", (updatedMsg) => {
      if (updatedMsg.chat === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))
        );
      }
    });

    socket.on("messageDeleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    });

    socket.on("messagePinned", ({ messageId, isPinned }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isPinned } : m))
      );
    });

    const handleReactionUpdate = (updatedMessage) => {
      if (updatedMessage.chat === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
        );
      }
    };

    socket.on("reactionUpdated", handleReactionUpdate);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageUpdated");
      socket.off("messageDeleted");
      socket.off("messagePinned");
      socket.off("reactionUpdated", handleReactionUpdate);
    };
  }, [conversationId, socket]);

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  // Scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const loadMessages = async () => {
    if (!conversationId || !token) return;
    try {
      const { data } = await axios.get(
        `${API_URL}/api/chats/${conversationId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(data);
    } catch (err) {
      console.error("Error loading messages:", err);
      setMessages([]);
    }
  };

  // Socket: handle typing (1-to-1 only)
  useEffect(() => {
    if (!socket || !conversationId || isGroup) return;

    const handleTypingEvent = ({ userId, typing }) => {
      if (userId === user.id) return; // ignore self
      setTypingUsers((prev) =>
        typing
          ? [...new Set([...prev, userId])]
          : prev.filter((id) => id !== userId)
      );
    };

    socket.on("typing", handleTypingEvent);

    return () => {
      socket.off("typing", handleTypingEvent);
    };
  }, [socket, conversationId, isGroup, user.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !file) || !conversationId || !user || !socket)
      return;

    const text = newMessage;
    const replyToId = replyingTo?._id || null;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("chatId", conversationId);
      formData.append("text", text);
      if (file) formData.append("file", file);
      if (audioBlob) formData.append("file", audioBlob, "voice-message.webm");
      if (replyToId) formData.append("replyTo", replyToId);

      const { data } = await axios.post(
        `${API_URL}/api/messages/send`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Send via socket
      if (data?.message) {
        // ✅ Emit via Socket.IO after saving message
        socket.emit("sendMessage", data.message, (ack) => {
          if (ack?.ok) {
            console.log("Message broadcasted successfully");
          }
        });
      }
    } catch (err) {
      console.error("Send message error:", err);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
      setNewMessage("");
      setReplyingTo(null);
      setFile(null);
      setFilePreview(null);
      setAudioBlob(null);
      setAudioURL(null);
    }
  };

  const handleAddReaction = (messageId, emoji) => {
    if (!socket || !user) return;
    socket.emit("addReaction", {
      messageId,
      emoji: emoji.native || emoji.colons || emoji.skins?.[0]?.native,
      userId: user._id,
    });
    setShowEmojiPicker(null);
  };

  const handleDeleteGroup = async () => {
    try {
      setDeleting(true);
      await axios.delete(`${API_URL}/api/chats/group/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Group deleted successfully");
      setShowDeleteConfirm(false);
      socket.emit("groupDeleted", { chatId: conversationId });

      // ✅ Notify parent component to remove group from sidebar
      onChatDeleted?.(conversationId);
    } catch (err) {
      console.error("Delete group failed:", err);
      toast.error(err.response?.data?.message || "Failed to delete group");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteChat = async () => {
    try {
      setDeletingChat(true);
      const res = await axios.delete(
        `${API_URL}/api/chats/private/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success(res.data.message);
      socket.emit("chatDeleted", { chatId: conversationId }); // optional if backend emits
      onChatDeleted?.(conversationId);
      setShowDeleteChatModal(false);
    } catch (err) {
      console.error("Delete chat failed:", err);
      toast.error(err.response?.data?.message || "Failed to delete chat");
    } finally {
      setDeletingChat(false);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      setLeaving(true);
      console.log("Token from Message area: ", token);

      const res = await axios.patch(
        `${API_URL}/api/chats/group/${conversationId}/leave`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success(res.data.message);
      setShowLeaveConfirm(false);
      // Optionally trigger parent refresh or navigation
      window.location.reload();
    } catch (err) {
      console.error("Leave group failed:", err);
      toast.error(err.response?.data?.message || "Failed to Leave group");
    } finally {
      setLeaving(false);
    }
  };

  const startEditMessage = (msg) => {
    setEditingMessage(msg);
    setNewMessage(msg.text);
  };

  const handleEditMessage = async (e) => {
    e.preventDefault();
    if (!editingMessage || !newMessage.trim()) return;

    try {
      const { data } = await axios.patch(
        `${API_URL}/api/messages/${editingMessage._id}/edit`,
        { newText: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(data.message);
      setEditingMessage(null);
      setNewMessage("");
      setMessages((prev) =>
        prev.map((m) => (m._id === data.msg._id ? data.msg : m))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to edit message");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const { data } = await axios.delete(
        `${API_URL}/api/messages/${messageId}/delete`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success(data.message);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete message");
    }
  };

  const handlePinMessage = async (messageId) => {
    try {
      const { data } = await axios.patch(
        `${API_URL}/api/messages/${messageId}/pin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(data.message);

      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, isPinned: !m.isPinned } : m
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to pin message");
    }
  };

  // Handle typing with debounce
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!socket || !conversationId || isGroup) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { chatId: conversationId, typing: true });
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing", { chatId: conversationId, typing: false });
    }, 1000); // stop typing after 1 sec of inactivity
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) return format(date, "h:mm a");
    else if (diffInHours < 48) return "Yesterday " + format(date, "h:mm a");
    else return format(date, "MMM d, h:mm a");
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-50">
      <div className="p-2 bg-white border-b border-slate-200 shadow-sm">
        <div
          className="flex items-center justify-between space-x-3 cursor-pointer rounded-2xl bg-white border border-slate-200 transition-all hover:bg-slate-50 duration-300 p-2 "
          onClick={() => {
            if (isGroup) setShowMembers(true);
          }}
        >
          <div className="flex items-center gap-4 p-3 ">
            <div className="relative">
              <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-blue-100">
                <AvatarFallback
                  className={`${
                    isGroup
                      ? "bg-gradient-to-br from-emerald-500 to-teal-500"
                      : "bg-gradient-to-br from-blue-500 to-indigo-500"
                  } text-white font-semibold flex items-center justify-center`}
                >
                  {isGroup ? (
                    conversationProfile ? (
                      <Image
                        src={conversationProfile}
                        alt="Group Profile"
                        width={0}
                        height={0}
                        sizes="100vw"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(conversationName)
                    )
                  ) : (
                    getInitials(conversationName)
                  )}
                </AvatarFallback>
              </Avatar>

              {/* Online status dot */}
              {!isGroup && (
                <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>

            <div className="flex flex-col justify-center">
              <h2 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                {conversationName}
                {isGroup && (
                  <span className="text-[10px] px-2 py-0 rounded-full bg-emerald-100 text-emerald-700 font-medium border border-emerald-200">
                    Group
                  </span>
                )}
              </h2>

              <p className="text-xs text-slate-500 mt-0.5">
                {isGroup ? "Tap to view members" : "Private Chat"}
              </p>
            </div>
          </div>

          {/* Dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-slate-100 rounded-full transition"
              >
                <EllipsisVertical className="h-5 w-5 text-slate-700" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-44 rounded-xl shadow-lg border border-slate-100"
            >
              {isGroup ? (
                <>
                  <DropdownMenuItem
                    className="cursor-pointer flex items-center gap-2 sm:hidden hover:bg-slate-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBack();
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 text-slate-700" />
                    Back
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer flex items-center gap-2 hover:bg-slate-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMembers(true);
                    }}
                  >
                    <Users className="h-4 w-4 text-slate-700" />
                    View Members
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="cursor-pointer flex items-center gap-2 hover:bg-slate-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchOpen(true);
                    }}
                  >
                    <Search className="h-4 w-4 text-slate-700" />
                    Search
                  </DropdownMenuItem>
                  {createdBy === user._id ? (
                    <>
                      <DropdownMenuItem
                        className="cursor-pointer flex items-center gap-2 hover:bg-blue-50 text-slate-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAddMember(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4 text-slate-700" />
                        Add Member
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="cursor-pointer flex items-center gap-2 text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMembers(false);
                          setShowAddMember(false);
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Group
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="cursor-pointer flex items-center gap-2 text-red-600 hover:bg-red-50"
                        onClick={() => setShowLeaveConfirm(true)}
                      >
                        <LogOut className="h-4 w-4" />
                        Leave Group
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              ) : (
                <>
                  <DropdownMenuItem
                    className="cursor-pointer flex items-center gap-2 hover:bg-slate-50 sm:hidden"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBack();
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 text-slate-700" />
                    Back
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer flex items-center gap-2 hover:bg-slate-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchOpen(true);
                    }}
                  >
                    <Search className="h-4 w-4 text-slate-700" />
                    Search
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer flex items-center gap-2 text-red-600 hover:bg-red-50"
                    onClick={() => setShowDeleteChatModal(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Chat
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {searchOpen && (
          <div className="absolute left-4 top-24 z-40 w-[90%] sm:w-[22rem] backdrop-blur-md bg-white/70 border border-slate-200 shadow-lg rounded-2xl px-3 py-2 flex items-center space-x-2 transition-all duration-300 animate-in fade-in slide-in-from-top-2">
            <Search className="w-4 h-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Search messages or people..."
              value={searchQuery}
              onChange={handleSearch}
              className="text-sm flex-1 bg-transparent border-none focus-visible:ring-0 placeholder:text-slate-400 text-slate-700"
            />
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : searchQuery ? (
              <button
                onClick={clearSearch}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            ) : (
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Close search"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            )}
          </div>
        )}

        {/* 🔹 Compact Search Navigation Bar */}
        {/* 🔹 Compact Search Navigation Bar */}
        {searchOpen && showResults && searchResults.length > 0 && (
          <div className="absolute right-6 top-24 z-50 flex items-center gap-3 bg-white/80 backdrop-blur-md border border-slate-200 shadow-lg px-4 py-2.5 rounded-2xl animate-in slide-in-from-top-3 fade-in duration-200">
            {/* Results count */}
            <p className="text-sm font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
              <span className="text-blue-600">{selectedIndex + 1}</span> /{" "}
              {searchResults.length}
            </p>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  if (selectedIndex > 0) {
                    const newIndex = selectedIndex - 1;
                    setSelectedIndex(newIndex);
                    scrollToMessage(searchResults[newIndex]._id, "up");
                  }
                }}
                disabled={selectedIndex <= 0}
                className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title="Previous result"
              >
                <ChevronUp className="w-4 h-4 text-slate-700" />
              </button>

              <button
                onClick={() => {
                  if (selectedIndex < searchResults.length - 1) {
                    const newIndex = selectedIndex + 1;
                    setSelectedIndex(newIndex);
                    scrollToMessage(searchResults[newIndex]._id, "down");
                  }
                }}
                disabled={selectedIndex >= searchResults.length - 1}
                className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title="Next result"
              >
                <ChevronDown className="w-4 h-4 text-slate-700" />
              </button>
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-slate-200"></div>

            {/* Clear Search */}
            <button
              onClick={clearSearch}
              className="p-2 rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition-all"
              title="Clear search"
            >
              <X className="w-4 h-4 text-rose-600" />
            </button>
          </div>
        )}
      </div>

      <ScrollArea
        className={`flex-1 relative p-4 ${
          dragActive ? "bg-blue-50 border-2 border-dashed border-blue-400" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragCounter((c) => c + 1);
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragCounter((c) => c - 1);
          if (dragCounter <= 1) setDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragCounter(0);
          setDragActive(false);

          const droppedFile = e.dataTransfer.files[0];
          if (!droppedFile) return;

          setFile(droppedFile);

          const reader = new FileReader();
          reader.onload = (event) => setFilePreview(event.target.result);
          reader.readAsDataURL(droppedFile);
        }}
      >
        {dragActive && (
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center
               bg-gradient-to-tr from-white/80 to-blue-50/70
               border-2 border-dashed border-blue-400 rounded-2xl
               shadow-xl backdrop-blur-sm
               transition-all duration-300"
          >
            <div className="p-5 bg-white/50 rounded-full shadow-lg animate-pulse">
              {/* Use a modern upload icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-16 h-16 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0l-4 4m4-4l4 4"
                />
              </svg>
            </div>
            <p className="mt-4 px-6 py-3 bg-white/60 rounded-full text-blue-700 font-semibold text-lg shadow-sm text-center">
              Drag & drop files to share
            </p>
          </div>
        )}

        {messages.some((m) => m.isPinned) && (
          <div className="sticky top-0 z-30 group p-4 rounded-2xl shadow-sm border border-indigo-200 bg-white/70 backdrop-blur-md transition-all duration-300 hover:shadow-md">
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-indigo-700">
                <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-md">
                  📌
                </span>
                Pinned Messages
              </h3>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {messages.filter((m) => m.isPinned).length} pinned
              </span>
            </div>

            {/* Collapsible pinned content */}
            <div className="overflow-hidden transition-all duration-500 ease-in-out max-h-11 group-hover:max-h-60">
              <div className="space-y-2">
                {messages
                  .filter((m) => m.isPinned)
                  .map((m) => (
                    <div
                      key={m._id}
                      className="px-3 py-2 rounded-xl flex justify-between items-center gap-3 transition-all duration-300 border border-indigo-100 bg-gradient-to-r from-indigo-50 to-slate-50 shadow-sm hover:shadow-md"
                    >
                      <p className="text-sm text-slate-700 leading-snug line-clamp-2 flex-1">
                        {m.text}
                      </p>
                      <button
                        type="button"
                        onClick={() => scrollToMessage(m._id)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-100 hover:bg-indigo-200 px-2 py-1 rounded-md transition-all"
                      >
                        View
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="h-[calc(100vh-15rem)] text-center py-16 px-4 bg-gradient-to-b from-white via-slate-50 to-slate-100 rounded-2xl border border-slate-100 shadow-inner flex flex-col items-center justify-center">
              <div className="inline-flex items-center justify-center p-6 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full shadow-lg ring-4 ring-white mb-5 animate-bounce-slow">
                <Send className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 tracking-tight">
                No messages yet
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Start the conversation and break the silence ✨
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              console.log("message", message);
              // ensure we have a ref-holder object for this message id
              if (!messageRefs.current[message._id]) {
                messageRefs.current[message._id] = { current: null };
              }
              // get the holder
              const msgRefHolder = messageRefs.current[message._id];
              const sender = message.sender || message.senderId || {};
              const isOwn =
                message.sender?._id === user._id ||
                message.senderId === user._id;
              const showAvatar =
                !isOwn &&
                (index === 0 ||
                  messages[index - 1]?.sender?._id !== message.sender?._id);

              return (
                <div
                  ref={(el) => {
                    msgRefHolder.current = el;
                  }}
                  key={message._id || message.id}
                  className={`flex ${
                    isOwn ? "justify-end" : "justify-start"
                  } mb-4 group relative z-10 py-1`}
                >
                  {/* Avatar (for others) */}
                  {!isOwn && (
                    <Avatar
                      className={`h-8 w-8 ${
                        showAvatar ? "visible" : "invisible"
                      }`}
                    >
                      <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-600 text-white text-xs font-semibold">
                        {getInitials(
                          sender.full_name || sender.name || sender.username
                        )}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {/* Message Container */}
                  <div
                    className={`flex flex-col ${
                      isOwn ? "items-end text-right" : "items-start text-left"
                    } max-w-md`}
                  >
                    {/* Sender Name */}
                    {!isOwn && showAvatar && (
                      <span className="text-xs text-slate-600 mb-1 px-2 font-medium">
                        {sender.full_name || sender.name || sender.username}
                      </span>
                    )}

                    <div className="flex items-center">
                      <div
                        className={`flex flex-col ${
                          isOwn ? "items-end" : "items-start"
                        }`}
                      >
                        {/* Reply Preview */}
                        {message.replyTo && (
                          <div className="bg-slate-50 border-l-4 border-indigo-500 rounded-md px-3 py-1 mb-1 text-sm text-slate-700 shadow-sm">
                            <p className="font-medium text-xs text-indigo-600">
                              {message.replyTo?.sender?.name || "Unknown"}
                            </p>
                            <p className="truncate">{message.replyTo?.text}</p>
                          </div>
                        )}

                        {/* Message Content */}
                        <div className="flex">
                          <div
                            className={`flex flex-col space-y-2 ${
                              isOwn && "items-end"
                            }`}
                          >
                            {/* Attachments */}
                            {message.fileUrl && (
                              <div className="w-fit">
                                {message.fileType.startsWith("image") && (
                                  <img
                                    src={message.fileUrl}
                                    alt="attachment"
                                    className="max-w-xs rounded-xl shadow-md border border-slate-200 cursor-pointer hover:scale-[1.02] transition-transform"
                                    onClick={() =>
                                      setImageModal({
                                        open: true,
                                        src: message.fileUrl,
                                      })
                                    }
                                  />
                                )}
                                {message.fileType.startsWith("video") && (
                                  <video
                                    controls
                                    className="max-w-xs rounded-xl border border-slate-200 shadow-sm"
                                  >
                                    <source
                                      src={message.fileUrl}
                                      type={message.fileType}
                                    />
                                    Your browser does not support the video tag.
                                  </video>
                                )}
                                {message.fileType === "application/pdf" && (
                                  <Link
                                    href={message.fileUrl}
                                    target="_blank"
                                    download={message.fileUrl.split("/").pop()}
                                    className="flex items-center space-x-2 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 shadow-sm cursor-pointer max-w-xs transition-all"
                                  >
                                    <FileText className="w-5 h-5 text-red-600" />
                                    <span className="text-sm text-slate-800 truncate flex-1">
                                      {message.fileUrl.split("/").pop()}
                                    </span>
                                    <Download className="w-4 h-4 text-slate-600" />
                                  </Link>
                                )}
                                {message.fileType?.startsWith("audio") && (
                                  <audio
                                    controls
                                    className="max-w-xs rounded-lg shadow-sm border border-slate-200"
                                  >
                                    <source
                                      src={message.fileUrl}
                                      type={message.fileType}
                                    />
                                    Your browser does not support the audio
                                    element.
                                  </audio>
                                )}
                              </div>
                            )}

                            {/* Message bubble with actions */}
                            <div className="flex items-center">
                              {/* Dropdown (for own messages) */}
                              {isOwn && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => e.stopPropagation()}
                                      className="h-6 w-6 rounded-full bg-white/70 hover:bg-white z-20 mb-1 shadow-sm"
                                    >
                                      <EllipsisVertical className="h-4 w-4 text-slate-700" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-36 z-50"
                                  >
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditMessage(message);
                                      }}
                                      disabled={
                                        Date.now() -
                                          new Date(
                                            message.createdAt
                                          ).getTime() >
                                        5 * 60 * 1000
                                      }
                                    >
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteMessage(message._id);
                                      }}
                                      className="text-red-600 hover:bg-red-50"
                                    >
                                      Delete
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReplyingTo(message);
                                      }}
                                    >
                                      Reply
                                    </DropdownMenuItem>
                                    {isGroup && createdBy === user._id && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handlePinMessage(message._id);
                                          }}
                                        >
                                          {message.isPinned
                                            ? "Unpin Message"
                                            : "Pin Message"}
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowEmojiPicker(
                                          showEmojiPicker === message._id
                                            ? null
                                            : message._id
                                        );
                                      }}
                                    >
                                      React
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}

                              {/* Message bubble */}
                              <div
                                className={`relative rounded-2xl px-4 py-2 shadow-sm ${
                                  isOwn
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                                    : "bg-white text-slate-900 border border-slate-200"
                                } max-w-xs sm:max-w-sm`}
                              >
                                {message.text && (
                                  <p className="text-sm leading-relaxed break-words">
                                    {message.text}
                                  </p>
                                )}
                                {/* Reactions */}
                                {message.reactions?.length > 0 && (
                                  <div className="absolute -bottom-2 -right-1 border rounded-full bg-white flex flex-wrap gap-1 px-1 py-0.5 shadow-sm">
                                    {message.reactions.map((r, idx) => (
                                      <span
                                        key={idx}
                                        className={`rounded-full text-xs px-1 ${
                                          r.users.includes(user._id)
                                            ? "bg-blue-100 text-blue-600"
                                            : "bg-gray-100 text-gray-700"
                                        }`}
                                      >
                                        {r.emoji}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Dropdown (for others’ messages) */}
                              {!isOwn && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => e.stopPropagation()}
                                      className="h-6 w-6 rounded-full bg-white/70 hover:bg-white z-20 mb-1 shadow-sm"
                                    >
                                      <EllipsisVertical className="h-4 w-4 text-slate-700" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-36 z-50"
                                  >
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReplyingTo(message);
                                      }}
                                    >
                                      Reply
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowEmojiPicker(
                                          showEmojiPicker === message._id
                                            ? null
                                            : message._id
                                        );
                                      }}
                                    >
                                      React
                                    </DropdownMenuItem>
                                    {isGroup && createdBy === user._id && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handlePinMessage(message._id);
                                          }}
                                        >
                                          {message.isPinned
                                            ? "Unpin Message"
                                            : "Pin Message"}
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Emoji Picker */}
                      {showEmojiPicker === message._id && (
                        <div className="absolute top-0 z-50 shadow-lg rounded-lg overflow-hidden">
                          <Picker
                            onEmojiSelect={(emoji) =>
                              handleAddReaction(message._id, emoji)
                            }
                          />
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center mt-1 space-x-1 text-xs text-slate-500">
                      <span>
                        {formatMessageTime(
                          message.createdAt || message.created_at
                        )}
                      </span>
                      {message?.isEdited && (
                        <span className="italic opacity-70">(edited)</span>
                      )}
                    </div>
                  </div>

                  {/* Image Modal */}
                  <Dialog
                    open={imageModal.open}
                    onOpenChange={(open) =>
                      setImageModal({ ...imageModal, open })
                    }
                  >
                    <DialogContent className="sm:max-w-3xl p-0 bg-transparent shadow-none">
                      <img
                        src={imageModal.src}
                        alt="enlarged"
                        className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              );
            })
          )}
          {/* Typing indicator for 1-to-1 */}
          {!isGroup && typingUsers.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in duration-300">
              <div className="relative">
                <Avatar className="h-8 w-8 ring-2 ring-slate-200">
                  <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-600 text-white text-xs font-semibold">
                    {getInitials(conversationName)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Animated typing dots */}
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0s]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>

              <span className="text-xs text-slate-600 italic font-medium">
                Typing...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-2 bg-white border-t border-slate-200">
        <form
          onSubmit={editingMessage ? handleEditMessage : handleSendMessage}
          className=""
        >
          {replyingTo && (
            <div className="group relative flex items-start justify-between gap-3 mb-3 px-4 py-3 rounded-xl border-l-[5px] border-blue-500/80 bg-gradient-to-r from-white/80 to-blue-50/60 backdrop-blur-md shadow-sm transition-all duration-300">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                  <span className="text-blue-600">↩</span>
                  Replying to{" "}
                  <span className="text-blue-700">
                    {replyingTo.sender?.name || "User"}
                  </span>
                </p>
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 italic">
                  “{replyingTo.text}”
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setReplyingTo(null)}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-300"
              >
                ✕
              </Button>

              {/* Decorative Glow */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-100/30 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          )}

          {filePreview && (
            <div className="mb-2 flex items-center justify-between">
              {file.type.startsWith("image") && (
                <img
                  src={filePreview}
                  alt="preview"
                  className="max-w-24 rounded-lg"
                />
              )}
              {file.type.startsWith("video") && (
                <video controls className="max-w-xs rounded-lg">
                  <source src={filePreview} type={file.type} />
                </video>
              )}
              {file.type === "application/pdf" && (
                <p className="text-sm text-gray-600">{file.name}</p>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setFilePreview(null);
                }}
                className="cursor-pointer px-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-red-400 text-sm"
              >
                <X />
              </Button>
            </div>
          )}
          {audioURL && (
            <div className="mt-2 flex items-center gap-2 bg-slate-100 p-2 rounded-lg">
              <audio controls src={audioURL} className="w-full" />
              <Button
                variant="ghost"
                type="button"
                size="icon"
                onClick={() => {
                  setAudioBlob(null);
                  setAudioURL(null);
                }}
                className="text-red-500"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-3 bg-white">
            {/* File Upload */}
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="fileInput"
            />
            <label
              htmlFor="fileInput"
              className="flex items-center justify-center p-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all duration-200 shadow-sm cursor-pointer group"
              title="Attach file"
            >
              <Paperclip className="h-4 w-4 text-slate-600 group-hover:text-slate-800 transition-colors" />
            </label>

            {/* Message Input */}
            <div className="relative flex-1">
              <Input
                placeholder={
                  editingMessage ? "Edit your message..." : "Type a message..."
                }
                value={newMessage}
                onChange={handleTyping}
                disabled={loading}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl outline-none  focus:border-blue-500 text-sm placeholder:text-slate-400 shadow-sm h-11"
              />
              {editingMessage && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingMessage(null);
                    setNewMessage("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </Button>
              )}
            </div>

            {/* Voice Recording */}
            {!recording ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={startRecording}
                className="rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 shadow-sm transition-all duration-200"
                title="Start recording"
              >
                <Mic className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={stopRecording}
                className="rounded-full bg-red-500 hover:bg-red-600 shadow-md transition-all duration-200"
                title="Stop recording"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </Button>
            )}

            {/* Send Button */}
            <Button
              type="submit"
              size="icon"
              disabled={loading || (!newMessage.trim() && !file)}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-md"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
      {/* Add modal below */}
      {isGroup && (
        <GroupMembersModal
          open={showMembers}
          onOpenChange={setShowMembers}
          members={conversationMembers}
          groupName={conversationName}
          groupDesc={conversationDescription}
          groupProfile={conversationProfile}
          createdBy={createdBy}
        />
      )}
      <AddMembersModal
        open={showAddMember}
        onOpenChange={setShowAddMember}
        conversationId={conversationId}
        currentMembers={conversationMembers}
      />

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Group?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this group? This action cannot be
            undone.
          </p>
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showDeleteChatModal} onOpenChange={setShowDeleteChatModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Chat?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this private chat? This cannot be
            undone.
          </p>
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteChatModal(false)}
              disabled={deletingChat}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteChat}
              disabled={deletingChat}
            >
              {deletingChat ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave Group?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Are you sure you want to Leave this group? This action cannot be
            undone.
          </p>
          <DialogFooter className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowLeaveConfirm(false)}
              disabled={leaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveGroup}
              disabled={leaving}
            >
              {leaving ? "Leaving..." : "Leave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
