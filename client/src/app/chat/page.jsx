"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { MessageArea } from "@/components/chat/MessageArea";
import { UserSearchModal } from "@/components/chat/UserSearchModal";
import { CreateGroupModal } from "@/components/chat/CreateGroupModal";
import { ProfileModal } from "@/components/chat/ProfileModal";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function ChatPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (authLoading) return; // Wait until auth check is done
    if (!user || !token) {
      router.push("/login");
    } else {
      loadConversations();
    }
  }, [user, token, authLoading]);

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // Load conversations
  const loadConversations = async () => {
    if (!token) return;

    try {
      const res = await axios.get(`${API_BASE}/api/chats`, axiosConfig);
      setConversations(res.data);
      console.log("conversations", res.data);
    } catch (err) {
      console.error("Error loading conversations:", err);
      toast.error("Error loading conversations");
    }
    setLoading(false);
  };

  // Load selected conversation details
  useEffect(() => {
    if (selectedConversationId) {
      const conv = conversations.find((c) => c._id === selectedConversationId);
      if (conv) {
        setSelectedConversation(conv);
      }
    }
  }, [selectedConversationId, conversations]);

  // Handle selecting user for private chat
  const handleSelectUser = async (otherUserId) => {
    try {
      const res = await axios.post(
        `${API_BASE}/api/chats/private`,
        { otherUserId },
        axiosConfig
      );

      const chat = res.data;
      setSelectedConversationId(chat._id);

      // Refresh conversation list
      loadConversations();
    } catch (err) {
      console.error("Error creating/getting private chat:", err);
      toast.error("Error creating/getting private chat");
    }
  };

  // Handle creating group chat
  const handleCreateGroup = (newGroup) => {
    // newGroup is already the created group chat from backend
    setConversations((prev) => [newGroup, ...prev]);
    setSelectedConversationId(newGroup._id);
    setSelectedConversation(newGroup);
  };

  console.log(selectedConversation);
  console.log("selected chat conv id ", selectedConversationId);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-screen bg-slate-100 flex">
        <div
          className={`w-full sm:w-80 lg:w-96 flex-shrink-0 border-r border-slate-200 
    ${selectedConversation ? "hidden sm:block" : "block"}`}
        >
          <ChatSidebar
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
            onShowUserSearch={() => setShowUserSearch(true)}
            onShowCreateGroup={() => setShowCreateGroup(true)}
            onShowProfile={() => setShowProfile(true)}
            onNewChat={(newChat) =>
              setConversations((prev) => {
                const exists = prev.some((c) => c._id === newChat._id);
                if (exists) return prev;
                return [newChat, ...prev];
              })
            }
            onChatDeleted={(chatId) => {
              setConversations((prev) => prev.filter((c) => c._id !== chatId));
              if (selectedConversationId === chatId) {
                setSelectedConversation(null);
                setSelectedConversationId(null);
              }
            }}
          />
        </div>

        <div
          className={`flex-1 flex flex-col 
    ${selectedConversation ? "block" : "hidden sm:block"}`}
        >
          {selectedConversation ? (
            <MessageArea
              conversationId={selectedConversation._id}
              conversationName={
                selectedConversation.isGroup
                  ? selectedConversation.name || "Group Chat"
                  : selectedConversation.participants.find(
                      (p) => p._id !== user._id
                    )?.name || "Unknown User"
              }
              conversationProfile={selectedConversation.groupProfilePic}
              conversationDescription={selectedConversation.groupDescription}
              isGroup={selectedConversation.isGroup}
              token={token}
              conversationMembers={selectedConversation.participants}
              createdBy={selectedConversation.createdBy}
              onChatDeleted={(chatId) => {
                setConversations((prev) =>
                  prev.filter((c) => c._id !== chatId)
                );
                if (selectedConversationId === chatId) {
                  setSelectedConversation(null);
                  setSelectedConversationId(null);
                }
              }}
              onBack={() => {
                setSelectedConversation(null);
                setSelectedConversationId(null);
              }}
            />
          ) : (
            <div className="flex-1 flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
              <div className="text-center space-y-6">
                {/* Icon Container */}
                <div className="relative inline-block">
                  <div className="absolute inset-0 blur-xl bg-blue-400/30 rounded-3xl animate-pulse"></div>
                  <div className="relative p-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl shadow-2xl ring-4 ring-white/30">
                    <MessageCircle className="h-16 w-16 text-white drop-shadow-md" />
                  </div>
                </div>

                {/* Text Content */}
                <div>
                  <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                    Welcome to ChatFlow
                  </h2>
                  <p className="mt-2 text-slate-600 text-base max-w-sm mx-auto leading-relaxed">
                    Start a new conversation or select an existing one to begin
                    connecting instantly with your friends or team.
                  </p>
                </div>

                {/* Optional Decorative Divider */}
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <span className="h-px w-10 bg-slate-300"></span>
                  <span className="text-slate-400 text-sm">
                    Powered by ChatFlow
                  </span>
                  <span className="h-px w-10 bg-slate-300"></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <UserSearchModal
        open={showUserSearch}
        onOpenChange={setShowUserSearch}
        onSelectUser={handleSelectUser}
      />

      <CreateGroupModal
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        onCreateGroup={handleCreateGroup}
      />

      <ProfileModal open={showProfile} onOpenChange={setShowProfile} />
    </>
  );
}
