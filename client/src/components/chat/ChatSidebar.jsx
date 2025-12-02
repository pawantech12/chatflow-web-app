"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Users, User, Search, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/socketContext";
import Image from "next/image";

export function ChatSidebar({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onShowUserSearch,
  onShowCreateGroup,
  onShowProfile,
  onNewChat,
  onChatDeleted,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarChats, setSidebarChats] = useState(conversations);
  const { user, setUser, logout } = useAuth();

  const socket = useSocket();

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewChatMessage = ({ chatId, lastMessage, unreadCount }) => {
      // Determine display text for sidebar preview
      let previewText = lastMessage?.text || "";

      if (!previewText && lastMessage?.fileUrl) {
        const isOwnMessage =
          lastMessage?.sender?._id === user._id ||
          lastMessage?.sender === user._id;

        // choose label based on file type
        let label = "File";
        if (lastMessage.fileType?.startsWith("image")) label = "Photo";
        else if (lastMessage.fileType?.startsWith("video")) label = "Video";
        else if (lastMessage.fileType === "application/pdf") label = "PDF";

        previewText = isOwnMessage
          ? `📎 ${label} sent`
          : `📎 ${label} received`;
      }

      // Merge with chat list
      setSidebarChats((prev) =>
        prev.map((c) =>
          c._id === chatId
            ? {
                ...c,
                lastMessage: { ...lastMessage, text: previewText },
                unread: unreadCount,
              }
            : c
        )
      );
    };

    // When messages are marked as read
    const handleChatReadUpdate = ({ chatId, unreadCount }) => {
      setSidebarChats((prev) =>
        prev.map((c) => (c._id === chatId ? { ...c, unread: unreadCount } : c))
      );
    };

    // User online/offline updates
    const handleUserStatusUpdate = ({ userId, status }) => {
      // Update logged-in user's profile section real-time
      setUser((prev) =>
        prev && prev._id === userId ? { ...prev, status } : prev
      );

      // Update sidebar chats
      setSidebarChats((prev) =>
        prev.map((chat) => {
          if (chat.isGroup) return chat;
          const updatedParticipants = chat.participants.map((p) =>
            p._id === userId ? { ...p, status } : p
          );
          return { ...chat, participants: updatedParticipants };
        })
      );
    };

    // --- New: handle message edited ---
    const handleMessageUpdated = ({ chatId, updatedMessage }) => {
      const refreshLastMessage = async (chatId) => {
        const { data } = await axios.get(
          `${API_URL}/api/chats/${chatId}/lastMessage`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSidebarChats((prev) =>
          prev.map((c) => (c._id === chatId ? { ...c, lastMessage: data } : c))
        );
      };

      refreshLastMessage(chatId);
    };

    const handleNewGroup = (newGroup) => {
      setSidebarChats((prev) => [newGroup, ...prev]);
      onNewChat?.(newGroup);
      onSelectConversation?.(newGroup._id);
    };

    const handleNewChatCreated = (newChat) => {
      setSidebarChats((prev) => {
        // Prevent duplicates
        const exists = prev.some((c) => c._id === newChat._id);
        if (exists) return prev;
        return [newChat, ...prev];
      });

      // Auto-join new chat room
      socket.emit("joinRoom", { chatId: newChat._id });
      onNewChat?.(newChat);
    };

    const handleChatDeleted = ({ chatId }) => {
      setSidebarChats((prev) => prev.filter((c) => c._id !== chatId));
      onChatDeleted?.(chatId);
    };

    const handleGroupDeleted = ({ chatId }) => {
      setSidebarChats((prev) => prev.filter((c) => c._id !== chatId));
      onChatDeleted?.(chatId);
    };

    socket.on("groupDeleted", handleGroupDeleted);

    socket.on("chatDeleted", handleChatDeleted);

    socket.on("newChatMessage", handleNewChatMessage);
    socket.on("newChatCreated", handleNewChatCreated);

    socket.on("chatReadUpdate", handleChatReadUpdate);
    socket.on("messageUpdated", handleMessageUpdated);
    socket.on("newGroupCreated", handleNewGroup);
    socket.on("userStatusUpdate", handleUserStatusUpdate);

    return () => {
      socket.off("newChatMessage", handleNewChatMessage);
      socket.off("newChatCreated", handleNewChatCreated);
      socket.off("chatReadUpdate", handleChatReadUpdate);
      socket.off("userStatusUpdate", handleUserStatusUpdate);
      socket.off("messageUpdated", handleMessageUpdated);
      socket.off("newGroupCreated", handleNewGroup);
      socket.off("chatDeleted", handleChatDeleted);
      socket.off("groupDeleted", handleGroupDeleted);
    };
  }, [socket]);

  console.log("Updated User: ", user);

  // Filter conversations based on search query
  const filteredConversations = sidebarChats.filter((conv) => {
    if (!searchQuery) return true;
    const searchTerm = searchQuery.toLowerCase();
    if (conv.isGroup && conv.name) {
      return conv.name.toLowerCase().includes(searchTerm);
    }
    if (conv.participants && !conv.isGroup) {
      const otherUser = conv.participants.find((p) => p._id !== user._id);
      if (!otherUser) return false;
      return (
        otherUser.username?.toLowerCase().includes(searchTerm) ||
        otherUser.name?.toLowerCase().includes(searchTerm)
      );
    }
    return false;
  });

  const sortedChats = [...filteredConversations].sort((a, b) => {
    const timeA = new Date(a.lastMessage?.createdAt || 0).getTime();
    const timeB = new Date(b.lastMessage?.createdAt || 0).getTime();
    return timeB - timeA; // newest on top
  });

  // Get conversation display name
  const getConversationName = (conv) => {
    if (conv.isGroup) return conv.name || "Group Chat";
    const otherUser = conv.participants?.find((p) => p._id !== user._id);
    return otherUser?.name || otherUser?.username || "Unknown User";
  };

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
  console.log("filteredConversations", filteredConversations);
  console.log("Profile", user);

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ChatFlow
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-slate-600 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-5 space-y-3 border-b border-slate-200 bg-white/70 backdrop-blur-sm rounded-xl shadow-sm">
        {/* New Chat */}
        <Button
          onClick={onShowUserSearch}
          className="w-full justify-start gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white font-medium tracking-wide shadow-md hover:shadow-lg transition-all duration-300 rounded-xl py-5"
        >
          <MessageCircle className="h-5 w-5" />
          Start New Chat
        </Button>

        {/* Create Group */}
        <Button
          onClick={onShowCreateGroup}
          variant="outline"
          className="w-full justify-start gap-3 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 font-medium transition-all duration-300 shadow-sm hover:shadow-md rounded-xl py-5"
        >
          <Users className="h-5 w-5" />
          Create New Group
        </Button>

        {/* My Profile */}
        <Button
          onClick={onShowProfile}
          variant="outline"
          className="w-full justify-start gap-3 border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium transition-all duration-300 shadow-sm hover:shadow-md rounded-xl py-5"
        >
          <User className="h-5 w-5" />
          View My Profile
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 w-full">
        <div className="p-2">
          {sortedChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-100 shadow-inner">
              <div className="relative">
                <div className="absolute inset-0 blur-xl bg-blue-100/50 rounded-full"></div>
                <div className="relative flex items-center justify-center h-16 w-16 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full shadow-md">
                  <MessageCircle className="h-8 w-8 text-white drop-shadow" />
                </div>
              </div>

              <h3 className="mt-6 text-lg font-semibold text-slate-800">
                No Conversations Yet
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Start a new chat and connect instantly.
              </p>
            </div>
          ) : (
            sortedChats.map((conv) => (
              <button
                key={conv._id}
                onClick={() => onSelectConversation(conv._id)}
                className={`w-full p-3 rounded-lg flex items-center space-x-3 transition-all duration-200 ${
                  selectedConversationId === conv._id
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200"
                    : "hover:bg-slate-50 border-2 border-transparent"
                }`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback
                      className={`${
                        conv.isGroup
                          ? "bg-gradient-to-br from-emerald-500 to-teal-500"
                          : "bg-gradient-to-br from-blue-500 to-indigo-500"
                      } text-white font-semibold`}
                    >
                      {conv.isGroup ? (
                        conv.groupProfilePic ? (
                          <Image
                            src={conv.groupProfilePic}
                            alt="Group Profile Pic"
                            width={0}
                            height={0}
                            sizes="100vw"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <Users className="h-6 w-6" />
                        )
                      ) : (
                        getInitials(getConversationName(conv))
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {!conv.isGroup && (
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                        conv.participants.find((p) => p._id !== user._id)
                          ?.status === "online"
                          ? "bg-green-500"
                          : "bg-slate-400"
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {getConversationName(conv)}
                    </h3>
                  </div>
                  {conv.lastMessage ? (
                    <p className="text-sm text-slate-600 truncate">
                      {conv.lastMessage.text}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-600 truncate">
                      No messages yet
                    </p>
                  )}
                </div>
                {conv.unread > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {conv.unread}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Profile Section */}
      {user && (
        <div className="p-2 border-t border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/60">
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-12 w-12 ring-2 ring-blue-100 shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-base">
                  {getInitials(user.name || user.username)}
                </AvatarFallback>
              </Avatar>

              {/* Online Indicator */}
              <span
                className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                  user.status === "online"
                    ? "bg-green-500 animate-pulse"
                    : user.status === "away"
                    ? "bg-yellow-400"
                    : "bg-slate-400"
                }`}
              />
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm truncate">
                {user?.name || user?.username}
              </p>
              <div className="flex items-center gap-1">
                <span
                  className={`text-xs font-medium ${
                    user?.status === "online"
                      ? "text-green-600"
                      : user?.status === "away"
                      ? "text-yellow-600"
                      : "text-slate-500"
                  }`}
                >
                  {user?.status || "offline"}
                </span>
              </div>
            </div>

            {/* Action Button (optional, for settings or menu) */}
          </div>
        </div>
      )}
    </div>
  );
}
