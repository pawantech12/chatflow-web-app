"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Crown, Users } from "lucide-react";
import Image from "next/image";

export function GroupMembersModal({
  open,
  onOpenChange,
  members,
  groupName,
  groupDesc,
  groupProfile,
  createdBy,
}) {
  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-slate-200 !text-center bg-slate-50">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
              {groupProfile ? (
                <Image
                  src={groupProfile}
                  alt="Group Profile Pic"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <Users className="h-6 w-6 text-white" />
              )}
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-slate-800">
            {groupName || "Group Members"}
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            <p className="text-sm text-slate-500">{groupDesc}</p>
            {members?.length || 0} member
            {members?.length === 1 ? "" : "s"}
          </p>
        </DialogHeader>

        {/* Members List */}
        <div className="p-4 max-h-80 overflow-y-auto space-y-2">
          {members?.length > 0 ? (
            members.map((m) => (
              <div
                key={m._id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-600 text-white font-semibold">
                      {getInitials(m.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-slate-800 leading-tight">
                      {m.name}
                    </p>
                    {m.email && (
                      <p className="text-xs text-slate-500">{m.email}</p>
                    )}
                  </div>
                </div>
                {m._id === createdBy ? (
                  <span className="flex items-center text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                    <Crown className="h-3 w-3 text-amber-500 mr-1" />
                    Admin
                  </span>
                ) : (
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    Member
                  </span>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-slate-600 italic py-8">
              No members found
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 py-3 text-center">
          <p className="text-xs text-slate-500">
            Only admins can manage members
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
