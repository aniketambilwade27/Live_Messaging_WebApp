"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCurrentConvexUser } from "@/hooks/useCurrentConvexUser";
import { MessageList } from "@/components/conversation/MessageList";
import { MessageInput } from "@/components/conversation/MessageInput";
import { TypingIndicator } from "@/components/conversation/TypingIndicator";
import { useEffect, useState } from "react";
import { ArrowLeft, Users, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ConversationPage() {
    const params = useParams();
    const router = useRouter();
    const conversationId = params.conversationId as Id<"conversations">;
    const { convexUser } = useCurrentConvexUser();
    const [showMembers, setShowMembers] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const deleteConversation = useMutation(api.conversations.deleteConversation);

    const handleDeleteGroup = async () => {
        if (!confirm("Delete this group? This will permanently remove all messages for everyone.")) return;
        setDeleting(true);
        try {
            await deleteConversation({ conversationId });
            toast.success("Group deleted");
            router.push("/conversations");
        } catch {
            toast.error("Failed to delete group");
            setDeleting(false);
        }
    };

    const conversation = useQuery(api.conversations.getConversation, {
        conversationId,
    });
    const messages = useQuery(api.messages.getMessages, { conversationId });
    const markRead = useMutation(api.messages.markConversationRead);
    const onlineUserIds = useQuery(api.presence.getOnlineUserIds, {});

    const typingUsers = useQuery(
        api.typing.getTypingUsers,
        convexUser
            ? { conversationId, currentUserId: convexUser._id }
            : "skip"
    );

    // Fetch all participants for groups
    const participants = useQuery(
        api.users.getParticipantsByIds,
        conversation?.participants
            ? { userIds: conversation.participants }
            : "skip"
    );

    // For 1:1 chats — get the other person
    const otherParticipantId = conversation?.isGroup
        ? null
        : conversation?.participants.find((p) => p !== convexUser?._id) ?? null;
    const otherUser = useQuery(
        api.users.getUserById,
        otherParticipantId ? { userId: otherParticipantId } : "skip"
    );

    // Get other user's last read time for read receipts (blue ticks)
    const otherUserLastReadTime = useQuery(
        api.messages.getReadReceipt,
        otherParticipantId && conversationId
            ? { conversationId, userId: otherParticipantId }
            : "skip"
    );

    // Mark as read when conversation is opened
    useEffect(() => {
        if (!convexUser?._id || !conversationId) return;
        markRead({ conversationId, userId: convexUser._id });
    }, [conversationId, convexUser?._id, markRead]);

    const isOtherOnline =
        otherParticipantId && onlineUserIds?.includes(otherParticipantId);

    const displayName = conversation?.isGroup
        ? conversation.groupName ?? "Group Chat"
        : otherUser?.username ?? "Loading...";

    const displayImage = conversation?.isGroup ? null : otherUser?.imageUrl;
    const memberCount = conversation?.participants.length ?? 0;
    const onlineMemberCount = participants?.filter(
        (p) => p && onlineUserIds?.includes(p._id)
    ).length ?? 0;

    return (
        <div className="flex flex-col h-full bg-slate-950">
            {/* Header */}
            <div className="border-b border-slate-700/50 bg-slate-900">
                <div className="flex items-center gap-3 px-4 py-3">
                    {/* Back button for mobile */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
                        onClick={() => router.push("/conversations")}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>

                    {/* Avatar */}
                    <div className="relative shrink-0">
                        {displayImage ? (
                            <img
                                src={displayImage}
                                alt={displayName}
                                className="w-9 h-9 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                                {conversation?.isGroup ? (
                                    <Users className="w-4 h-4" />
                                ) : (
                                    displayName[0]?.toUpperCase()
                                )}
                            </div>
                        )}
                        {/* Online dot for 1:1 */}
                        {!conversation?.isGroup && (
                            <span
                                className={cn(
                                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900",
                                    isOtherOnline ? "bg-emerald-400" : "bg-slate-600"
                                )}
                            />
                        )}
                    </div>

                    {/* Name + status */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-white font-semibold text-sm leading-none truncate">
                            {displayName}
                        </h1>
                        <p className="text-xs mt-0.5 text-slate-400">
                            {conversation?.isGroup
                                ? `${memberCount} members · ${onlineMemberCount} online`
                                : isOtherOnline
                                    ? "🟢 Online"
                                    : "⚫ Offline"}
                        </p>
                    </div>

                    {/* Toggle members panel + Delete group (groups only) */}
                    {conversation?.isGroup && (
                        <div className="flex items-center gap-1 shrink-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowMembers(!showMembers)}
                                className="text-slate-400 hover:text-white hover:bg-slate-800 gap-1 text-xs"
                            >
                                <Users className="w-3.5 h-3.5" />
                                Members
                                {showMembers ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </Button>
                            {/* Only show Delete button to the group creator */}
                            {conversation?.createdBy === convexUser?._id && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDeleteGroup}
                                    disabled={deleting}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 gap-1 text-xs"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {deleting ? "Deleting…" : "Delete"}
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Group members expandable panel */}
                {conversation?.isGroup && showMembers && (
                    <div className="px-4 pb-3 border-t border-slate-700/30 pt-2">
                        <div className="flex flex-wrap gap-2">
                            {participants?.map((member) => {
                                if (!member) return null;
                                const isOnline = onlineUserIds?.includes(member._id);
                                const isYou = member._id === convexUser?._id;
                                return (
                                    <div
                                        key={member._id}
                                        className="flex items-center gap-1.5 bg-slate-800 rounded-full pl-0.5 pr-2.5 py-0.5"
                                    >
                                        <div className="relative">
                                            {member.imageUrl ? (
                                                <img
                                                    src={member.imageUrl}
                                                    alt={member.username}
                                                    className="w-6 h-6 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-white text-[10px] font-bold">
                                                    {member.username[0]?.toUpperCase()}
                                                </div>
                                            )}
                                            <span
                                                className={cn(
                                                    "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-[1.5px] border-slate-800",
                                                    isOnline ? "bg-emerald-400" : "bg-slate-600"
                                                )}
                                            />
                                        </div>
                                        <span className="text-xs text-slate-300">
                                            {isYou
                                                ? `${member.username.split(" ")[0]} (You)`
                                                : member.username.split(" ")[0]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Messages */}
            {convexUser ? (
                <MessageList
                    messages={messages}
                    currentUserId={convexUser._id}
                    otherUserLastReadTime={otherUserLastReadTime ?? 0}
                />
            ) : (
                <div className="flex-1" />
            )}

            {/* Typing indicator */}
            <TypingIndicator
                names={
                    typingUsers
                        ?.filter(Boolean)
                        .map((u: any) => u.username.split(" ")[0]) ?? []
                }
            />

            {/* Message input */}
            {convexUser && (
                <MessageInput conversationId={conversationId} senderId={convexUser._id} />
            )}
        </div>
    );
}
