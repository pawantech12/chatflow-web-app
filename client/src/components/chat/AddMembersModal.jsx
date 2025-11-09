"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Check, Slash } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from "sonner";

export function AddMembersModal({
  open,
  onOpenChange,
  conversationId,
  currentMembers = [],
}) {
  const { token, user } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all users (including already in group)
  useEffect(() => {
    if (!open) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/api/users`, {
          params: {
            search: searchQuery || undefined,
            exclude: user.id, // exclude self
          },
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(data);
      } catch (err) {
        console.error("Search error:", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, token, user.id, open]);

  const toggleSelectMember = (member) => {
    // Prevent selecting if already in group
    const alreadyInGroup = currentMembers.find((m) => m._id === member._id);
    if (alreadyInGroup) return;

    setSelectedMembers((prev) =>
      prev.find((m) => m._id === member._id)
        ? prev.filter((m) => m._id !== member._id)
        : [...prev, member]
    );
  };

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) return;
    setLoading(true);
    try {
      const { data } = await axios.patch(
        `${API_URL}/api/chats/group/${conversationId}/add-member`,
        { newMemberIds: selectedMembers.map((m) => m._id) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(data.message);
      onOpenChange(false);
      setSelectedMembers([]);
      setSearchQuery("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to add members");
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
          <DialogTitle className="text-2xl font-bold text-slate-900">
            Add Members
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* User list */}
          <ScrollArea className="h-64">
            {loading ? (
              <div className="text-center py-8 text-slate-500">
                <div className="animate-pulse text-lg font-medium">
                  Loading...
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((profile) => {
                  const isSelected = selectedMembers.find(
                    (m) => m._id === profile._id
                  );
                  const alreadyInGroup = currentMembers.find(
                    (m) => m._id === profile._id
                  );

                  return (
                    <button
                      key={profile._id}
                      onClick={() => toggleSelectMember(profile)}
                      className={`w-full p-3 rounded-xl flex items-center space-x-3 border transition-all ${
                        alreadyInGroup
                          ? "bg-gray-100 border-gray-300 cursor-not-allowed opacity-60"
                          : isSelected
                          ? "bg-blue-100 border-blue-300 shadow-md"
                          : "hover:bg-slate-50 border-transparent"
                      }`}
                      disabled={alreadyInGroup}
                    >
                      <Avatar className="h-12 w-12 shadow">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                          {getInitials(profile.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-slate-900 text-lg">
                          {profile.name}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {profile.email || "No Email"}
                        </p>
                      </div>
                      {alreadyInGroup && (
                        <Slash className="h-5 w-5 text-red-500" />
                      )}
                      {isSelected && !alreadyInGroup && (
                        <Check className="h-5 w-5 text-blue-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Action buttons */}
          <div className="flex justify-end space-x-2 mt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMembers}
              disabled={loading || selectedMembers.length === 0}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
            >
              {loading ? "Adding..." : "Add Members"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
