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
import { Search, Plus, Users } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface Props {
    currentUserId: Id<"users">;
}

export function NewChatDialog({ currentUserId }: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const { user } = useUser();
    const router = useRouter();

    const users = useQuery(api.users.getUsers, {
        clerkId: user?.id ?? "",
        searchQuery: search,
    });

    const getOrCreate = useMutation(api.conversations.getOrCreateConversation);

    const handleUserClick = async (otherUserId: Id<"users">) => {
        const convoId = await getOrCreate({
            currentUserId,
            otherUserId,
        });
        setOpen(false);
        setSearch("");
        router.push(`/conversations/${convoId}`);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white gap-2 h-9"
                    size="sm"
                >
                    <Plus className="w-4 h-4" />
                    New Chat
                </Button>
            </DialogTrigger>

            <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white">Start a Conversation</DialogTitle>
                </DialogHeader>

                <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-violet-500"
                    />
                </div>

                <div className="mt-2 max-h-72 overflow-y-auto space-y-1">
                    {users === undefined && (
                        <div className="space-y-2 py-2">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 px-2 py-2 animate-pulse">
                                    <div className="w-9 h-9 rounded-full bg-slate-700" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3 bg-slate-700 rounded w-1/2" />
                                        <div className="h-2.5 bg-slate-700/60 rounded w-1/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {users?.length === 0 && (
                        <div className="flex flex-col items-center py-8 text-center">
                            <Users className="w-8 h-8 text-slate-600 mb-2" />
                            <p className="text-slate-500 text-sm">No users found</p>
                        </div>
                    )}

                    {users?.map((u) => (
                        <button
                            key={u._id}
                            onClick={() => handleUserClick(u._id)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-left"
                        >
                            {u.imageUrl ? (
                                <img
                                    src={u.imageUrl}
                                    alt={u.username}
                                    className="w-9 h-9 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                                    {u.username[0]?.toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-white">{u.username}</p>
                                <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
