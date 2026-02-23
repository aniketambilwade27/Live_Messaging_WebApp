"use client";

import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatMessageTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

interface MessageBubbleProps {
    message: {
        _id: Id<"messages">;
        content: string;
        senderId: Id<"users">;
        _creationTime: number;
        isDeleted: boolean;
        sender?: { username: string; imageUrl: string } | null;
        reactions: { emoji: string; count: number; userIds: string[] }[];
    };
    isOwn: boolean;
    currentUserId: Id<"users">;
    otherUserLastReadTime?: number;
}

export function MessageBubble({ message, isOwn, currentUserId, otherUserLastReadTime = 0 }: MessageBubbleProps) {
    const deleteMessage = useMutation(api.messages.deleteMessage);
    const toggleReaction = useMutation(api.reactions.toggleReaction);
    const [showEmojis, setShowEmojis] = useState(false);

    const handleDelete = async () => {
        try {
            await deleteMessage({ messageId: message._id });
        } catch {
            toast.error("Failed to delete message");
        }
    };

    const handleReaction = async (emoji: string) => {
        try {
            await toggleReaction({
                messageId: message._id,
                userId: currentUserId,
                emoji,
            });
        } catch {
            toast.error("Failed to react");
        }
        setShowEmojis(false);
    };

    return (
        <div
            className={cn(
                "flex items-end gap-2 group",
                isOwn ? "flex-row-reverse" : "flex-row"
            )}
        >
            {/* Avatar */}
            {!isOwn && (
                <div className="shrink-0 mb-1">
                    {message.sender?.imageUrl ? (
                        <img
                            src={message.sender.imageUrl}
                            className="w-7 h-7 rounded-full object-cover"
                            alt={message.sender.username}
                        />
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-semibold">
                            {message.sender?.username?.[0]?.toUpperCase() ?? "?"}
                        </div>
                    )}
                </div>
            )}

            <div className={cn("flex flex-col max-w-[70%]", isOwn ? "items-end" : "items-start")}>
                {/* Bubble */}
                <div className="relative">
                    <div
                        className={cn(
                            "relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                            isOwn
                                ? "bg-violet-600 text-white rounded-br-sm"
                                : "bg-slate-700/80 text-slate-100 rounded-bl-sm",
                            message.isDeleted && "opacity-60 italic"
                        )}
                    >
                        {message.isDeleted ? (
                            <span className="text-slate-400">This message was deleted</span>
                        ) : (
                            message.content
                        )}
                    </div>

                    {/* Action buttons (appear on hover) */}
                    {!message.isDeleted && (
                        <div
                            className={cn(
                                "absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                                isOwn ? "-left-20" : "-right-20"
                            )}
                        >
                            <button
                                onClick={() => setShowEmojis(!showEmojis)}
                                className="text-base hover:scale-125 transition-transform"
                                title="React"
                            >
                                😊
                            </button>
                            {isOwn && (
                                <button
                                    onClick={handleDelete}
                                    className="text-slate-500 hover:text-red-400 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Emoji picker */}
                    {showEmojis && (
                        <div
                            className={cn(
                                "absolute z-10 flex gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1.5 shadow-xl bottom-full mb-1",
                                isOwn ? "right-0" : "left-0"
                            )}
                        >
                            {EMOJIS.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => handleReaction(emoji)}
                                    className="text-lg hover:scale-125 transition-transform px-1"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reactions */}
                {message.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {message.reactions.map(({ emoji, count, userIds }) => (
                            <button
                                key={emoji}
                                onClick={() => handleReaction(emoji)}
                                className={cn(
                                    "flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full border transition-all",
                                    userIds.includes(currentUserId)
                                        ? "bg-violet-600/30 border-violet-500/50 text-white"
                                        : "bg-slate-700/50 border-slate-600/50 text-slate-300 hover:border-slate-500"
                                )}
                            >
                                <span>{emoji}</span>
                                <span>{count}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Timestamp + Read Receipt */}
                <span className="flex items-center gap-1 text-[10px] text-slate-600 mt-1 px-1">
                    {formatMessageTime(message._creationTime)}
                    {/* Blue/grey ticks for own messages only */}
                    {isOwn && !message.isDeleted && (
                        <span
                            className={cn(
                                "font-bold tracking-tighter",
                                otherUserLastReadTime >= message._creationTime
                                    ? "text-sky-400"   // Read = blue
                                    : "text-slate-500" // Sent/delivered = grey
                            )}
                            title={otherUserLastReadTime >= message._creationTime ? "Seen" : "Sent"}
                        >
                            ✓✓
                        </span>
                    )}
                </span>
            </div>
        </div>
    );
}
