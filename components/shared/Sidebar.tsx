"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { MessageSquare, Users } from "lucide-react";
import { useCurrentConvexUser } from "@/hooks/useCurrentConvexUser";
import { useEffect, useRef } from "react";
import { NewChatDialog } from "@/components/users/NewChatDialog";
import { GroupChatDialog } from "@/components/users/GroupChatDialog";
import { cn } from "@/lib/utils";
import { useConversation } from "@/hooks/useConversation";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function Sidebar() {
    const { user } = useUser();
    const { convexUser } = useCurrentConvexUser();
    const updatePresence = useMutation(api.presence.updatePresence);
    const { isActive } = useConversation();

    // Heartbeat for online presence
    useEffect(() => {
        if (!convexUser?._id) return;
        const update = () => updatePresence({ userId: convexUser._id });
        update();
        const interval = setInterval(update, 20_000);
        return () => clearInterval(interval);
    }, [convexUser?._id, updatePresence]);

    return (
        <aside className="flex flex-col h-full w-full bg-slate-900 border-r border-slate-700/50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-white text-sm">LiveChat</span>
                </div>
                <UserButton afterSignOutUrl="/sign-in" />
            </div>

            {/* New Chat + New Group buttons */}
            <div className="p-3 space-y-2 border-b border-slate-700/50">
                {convexUser && <NewChatDialog currentUserId={convexUser._id} />}
                {convexUser && <GroupChatDialog currentUserId={convexUser._id} />}
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {convexUser && <ConversationsList userId={convexUser._id} />}
            </div>
        </aside>
    );
}

function ConversationsList({ userId }: { userId: string }) {
    const conversations = useQuery(api.conversations.getConversations, {
        userId: userId as any,
    });
    const { conversationId: activeId } = useConversation();

    if (conversations === undefined) {
        return (
            <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-slate-700 shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-3 bg-slate-700 rounded w-3/4" />
                            <div className="h-2.5 bg-slate-700/60 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-slate-400 text-sm font-medium">No conversations yet</p>
                <p className="text-slate-600 text-xs mt-1">Start a chat using the button above</p>
            </div>
        );
    }

    return (
        <nav className="py-2">
            {conversations.map((conv) => {
                const name = conv.isGroup
                    ? conv.groupName
                    : (conv.otherParticipants[0] as any)?.username ?? "Unknown";
                const avatar = conv.isGroup ? null : (conv.otherParticipants[0] as any)?.imageUrl;
                const lastMsg = conv.lastMessage;
                const isActive = conv._id === activeId;
                const memberCount = conv.participants?.length ?? 0;

                return (
                    <Link
                        key={conv._id}
                        href={`/conversations/${conv._id}`}
                        className={cn(
                            "flex items-center gap-3 px-3 py-3 mx-2 rounded-xl transition-all",
                            isActive
                                ? "bg-violet-600/20 border border-violet-500/30"
                                : "hover:bg-slate-800/60"
                        )}
                    >
                        <div className="relative shrink-0">
                            {conv.isGroup ? (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                            ) : avatar ? (
                                <img
                                    src={avatar}
                                    alt={name}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                                    {name?.[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <span className="text-white text-sm font-medium truncate">{name}</span>
                                {conv.unreadCount > 0 && (
                                    <span className="bg-violet-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                                    </span>
                                )}
                            </div>
                            {conv.isGroup && (
                                <p className="text-[10px] text-slate-600">{memberCount} members</p>
                            )}
                            {lastMsg && (
                                <p className={cn(
                                    "text-xs truncate mt-0.5",
                                    conv.unreadCount > 0 ? "text-slate-300 font-medium" : "text-slate-500"
                                )}>
                                    {lastMsg.isDeleted ? "Message deleted" : lastMsg.content}
                                </p>
                            )}
                        </div>
                    </Link>
                );
            })}
        </nav>
    );
}
