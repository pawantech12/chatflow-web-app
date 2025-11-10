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
      <DialogContent className="sm:max-w-md w-full max-h-[90vh] overflow-y-auto">
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
              <div
                className="relative h-16 w-16 rounded-full bg-slate-100 cursor-pointer border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300"
                onClick={() =>
                  document.getElementById("groupImageInput").click()
                }
              >
                {/* Display selected image or placeholder */}
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Group Profile"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-slate-400 text-xs font-medium">
                    <Users className="w-6 h-6" />
                  </div>
                )}

                {/* Edit Icon Overlay */}
                <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1 border-2 border-white shadow-md hover:bg-blue-700 transition-all duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536M16.5 3.75a2.121 2.121 0 013 3L7 19H4v-3L16.5 3.75z"
                    />
                  </svg>
                </div>
              </div>

              {/* Hidden file input */}
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
          <div className="space-y-4">
            {/* Group Name */}
            <div className="space-y-1">
              <Label htmlFor="groupName" className="text-slate-700 font-medium">
                Group Name
              </Label>
              <div className="relative">
                <Input
                  id="groupName"
                  placeholder="Enter group name..."
                  className="h-12 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 shadow-sm placeholder:text-slate-400"
                  {...register("groupName", {
                    required: "Group name is required",
                    minLength: {
                      value: 3,
                      message: "Group name must be at least 3 characters",
                    },
                  })}
                />
              </div>
              {errors.groupName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.groupName.message}
                </p>
              )}
            </div>

            {/* Group Description */}
            <div className="space-y-1">
              <Label
                htmlFor="groupDescription"
                className="text-slate-700 font-medium"
              >
                Description (optional)
              </Label>
              <div className="relative">
                <Input
                  id="groupDescription"
                  placeholder="Write a short description..."
                  className="h-12 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all duration-300 shadow-sm placeholder:text-slate-400"
                  {...register("groupDescription")}
                />
              </div>
            </div>
          </div>

          {/* Search Users */}
          <div className="space-y-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">
                Add Members ({selectedUsers.size} selected)
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search users..."
                  {...register("searchQuery")}
                  className="pl-10 h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300"
                />
              </div>
            </div>

            {/* Users List */}
            <ScrollArea className="h-48 rounded-xl border border-slate-200 bg-white shadow-sm overflow-y-auto">
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
                <div className="space-y-2 p-2">
                  {users.map((u) => (
                    <div
                      key={u._id}
                      className={`flex items-center space-x-3 p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                        selectedUsers.has(u._id)
                          ? "bg-blue-50 shadow-inner border border-blue-200"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <Checkbox
                        checked={selectedUsers.has(u._id)}
                        onCheckedChange={() => toggleUser(u._id)}
                      />
                      <Avatar className="h-10 w-10 shadow-md">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs font-semibold">
                          {getInitials(u.name || u.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-slate-900 truncate">
                          {u.name || u.username}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">
                          @{u.username}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

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
