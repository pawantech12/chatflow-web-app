"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";

export function UserSearchModal({ open, onOpenChange, onSelectUser }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open, searchQuery]);

  const loadUsers = async () => {
    if (!user) return;
    setLoading(true);
    console.log(user);

    try {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users`,
        {
          params: {
            search: searchQuery,
            exclude: user._id, // exclude current user
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Start a New Chat</DialogTitle>
          <DialogDescription>
            Search for users to start a conversation
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by username or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-64">
            {loading ? (
              <div className="text-center py-8 text-slate-500">
                <div className="animate-pulse">Searching...</div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((profile) => (
                  <button
                    key={profile._id}
                    onClick={() => {
                      onSelectUser(profile._id);
                      onOpenChange(false);
                      setSearchQuery("");
                    }}
                    className="w-full p-3 rounded-lg flex items-center space-x-3 hover:bg-slate-50 transition-colors border border-transparent hover:border-blue-200"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                        {getInitials(profile.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-slate-900">
                        {profile.name}
                      </h4>
                    </div>
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
