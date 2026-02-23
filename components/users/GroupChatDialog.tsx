"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Check, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface Props {
    currentUserId: Id<"users">;
}

export function GroupChatDialog({ currentUserId }: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<
        { _id: Id<"users">; username: string; imageUrl: string }[]
    >([]);
    const [creating, setCreating] = useState(false);

    const { user } = useUser();
    const router = useRouter();

    const users = useQuery(api.users.getUsers, {
        clerkId: user?.id ?? "",
        searchQuery: search,
    });

    const createGroup = useMutation(api.conversations.createGroupConversation);

    const toggleUser = (u: {
        _id: Id<"users">;
        username: string;
        imageUrl: string;
    }) => {
        setSelectedUsers((prev) =>
            prev.find((x) => x._id === u._id)
                ? prev.filter((x) => x._id !== u._id)
                : [...prev, u]
        );
    };

    const handleCreate = async () => {
        if (!groupName.trim() || selectedUsers.length < 2) return;
        setCreating(true);
        try {
            const convoId = await createGroup({
                participantIds: [currentUserId, ...selectedUsers.map((u) => u._id)],
                groupName: groupName.trim(),
                createdBy: currentUserId,
            });
            setOpen(false);
            setGroupName("");
            setSelectedUsers([]);
            setSearch("");
            router.push(`/conversations/${convoId}`);
        } finally {
            setCreating(false);
        }
    };

    const canCreate = groupName.trim().length > 0 && selectedUsers.length >= 2;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white gap-2 h-9"
                    size="sm"
                >
                    <Users className="w-4 h-4" />
                    New Group
                </Button>
            </DialogTrigger>

            <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white">Create a Group Chat</DialogTitle>
                </DialogHeader>

                {/* Group name input */}
                <Input
                    placeholder="Group name (e.g. Team Alpha)"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-violet-500"
                />

                {/* Selected users chips */}
                {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {selectedUsers.map((u) => (
                            <span
                                key={u._id}
                                className="flex items-center gap-1 bg-violet-600/30 border border-violet-500/40 text-violet-200 text-xs px-2 py-1 rounded-full"
                            >
                                {u.username.split(" ")[0]}
                                <button
                                    onClick={() => toggleUser(u)}
                                    className="hover:text-white transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* User search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search members..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-violet-500"
                    />
                </div>

                {/* User list */}
                <div className="max-h-52 overflow-y-auto space-y-1">
                    {users?.length === 0 && (
                        <div className="py-6 text-center text-slate-500 text-sm">
                            No users found
                        </div>
                    )}
                    {users?.map((u) => {
                        const isSelected = !!selectedUsers.find((x) => x._id === u._id);
                        return (
                            <button
                                key={u._id}
                                onClick={() =>
                                    toggleUser({
                                        _id: u._id,
                                        username: u.username,
                                        imageUrl: u.imageUrl,
                                    })
                                }
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                                    isSelected
                                        ? "bg-violet-600/20 border border-violet-500/30"
                                        : "hover:bg-slate-800"
                                )}
                            >
                                {u.imageUrl ? (
                                    <img
                                        src={u.imageUrl}
                                        alt={u.username}
                                        className="w-8 h-8 rounded-full object-cover shrink-0"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                        {u.username[0]?.toUpperCase()}
                                    </div>
                                )}
                                <span className="text-sm text-white flex-1">{u.username}</span>
                                {isSelected && (
                                    <Check className="w-4 h-4 text-violet-400 shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Hint */}
                <p className="text-xs text-slate-500">
                    {selectedUsers.length < 2
                        ? `Select at least ${2 - selectedUsers.length} more member${2 - selectedUsers.length === 1 ? "" : "s"}`
                        : `${selectedUsers.length} members selected ✓`}
                </p>

                <Button
                    onClick={handleCreate}
                    disabled={!canCreate || creating}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40"
                >
                    {creating ? "Creating..." : "Create Group"}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
