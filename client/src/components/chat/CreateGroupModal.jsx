"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

export function CreateGroupModal({ open, onOpenChange, onCreateGroup }) {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      groupName: "",
      searchQuery: "",
    },
  });

  const searchQuery = watch("searchQuery");
  const groupName = watch("groupName");
  const [groupImage, setGroupImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGroupImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Fetch users when modal opens or search query changes
  useEffect(() => {
    if (open) {
      fetchUsers();
    } else {
      reset();
      setSelectedUsers(new Set());
      setUsers([]);
    }
  }, [open]);

  useEffect(() => {
    if (open) fetchUsers();
  }, [searchQuery]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { search: searchQuery, exclude: user.id },
        }
      );
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) newSelected.delete(userId);
    else newSelected.add(userId);
    setSelectedUsers(newSelected);
  };

  const handleCreate = async (data) => {
    if (loading) return;

    const { groupName, groupDescription } = data;
    if (!groupName.trim() || selectedUsers.size === 0) {
      toast.error("Enter group name and select at least one member");
      return;
    }

    const participantIds = Array.from(selectedUsers).filter(Boolean);
    // ✅ Add a strict check before API call
    if (!Array.isArray(participantIds) || participantIds.length < 1) {
      toast.error("Select at least one valid member");
      return;
    }

    setLoading(true);
    try {
      console.log("Creating group with:", { name: groupName, participantIds });

      const formData = new FormData();
      formData.append("name", groupName.trim());
      formData.append("participantIds", JSON.stringify(participantIds));
      if (groupDescription)
        formData.append("description", groupDescription.trim());
      if (groupImage) formData.append("groupProfilePic", groupImage);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chats/group`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.status === 201 && res.data) {
        onCreateGroup(res.data);
        toast.success("Group chat created successfully");
        // ✅ Reset everything
        reset();
        setSelectedUsers(new Set());
        setGroupImage(null);
        setImagePreview(null);
        onOpenChange(false);
        return;
      } else {
        toast.error("Unexpected response from server");
      }
    } catch (err) {
      console.error(
        "Group creation failed:",
        err.response?.data || err.message
      );
      toast.error(err.response?.data?.message || "Error creating group chat");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "";
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
          <DialogTitle className="text-2xl">Create Group Chat</DialogTitle>
          <DialogDescription>
            Add members to your new group conversation
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
          <div className="space-y-2">
            <Label>Group Profile Picture</Label>
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 rounded-full overflow-hidden bg-slate-100 border">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                    No Image
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  document.getElementById("groupImageInput").click()
                }
              >
                Choose Image
              </Button>
              <input
                id="groupImageInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              placeholder="Enter group name..."
              {...register("groupName", {
                required: "Group name is required",
                minLength: {
                  value: 3,
                  message: "Group name must be at least 3 characters",
                },
              })}
            />
            {errors.groupName && (
              <p className="text-red-500 text-xs">{errors.groupName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="groupDescription">Description (optional)</Label>
            <Input
              id="groupDescription"
              placeholder="Write a short description..."
              {...register("groupDescription")}
            />
          </div>

          {/* Search Users */}
          <div className="space-y-2">
            <Label>Add Members ({selectedUsers.size} selected)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search users..."
                {...register("searchQuery")}
                className="pl-9"
              />
            </div>
          </div>

          {/* Users List */}
          <ScrollArea className="h-48">
            {loading ? (
              <div className="text-center py-8 text-slate-500">
                <div className="animate-pulse">Loading...</div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedUsers.has(u._id)}
                      onCheckedChange={() => toggleUser(u._id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs">
                        {getInitials(u.name || u.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-slate-900">
                        {u.name || u.username}
                      </h4>
                      <p className="text-xs text-slate-600">@{u.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !groupName.trim() || selectedUsers.size === 0 || loading
              }
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
