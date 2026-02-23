"use client";

import { useEffect, useRef, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { MessageBubble } from "./MessageBubble";
import { ChevronDown, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    _id: Id<"messages">;
    content: string;
    senderId: Id<"users">;
    _creationTime: number;
    isDeleted: boolean;
    sender?: { username: string; imageUrl: string } | null;
    reactions: { emoji: string; count: number; userIds: string[] }[];
}

interface MessageListProps {
    messages: Message[] | undefined;
    currentUserId: Id<"users">;
    otherUserLastReadTime?: number;
}

export function MessageList({ messages, currentUserId, otherUserLastReadTime = 0 }: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [prevCount, setPrevCount] = useState(0);

    const isNearBottom = () => {
        const el = containerRef.current;
        if (!el) return true;
        return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    };

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        setShowScrollButton(false);
    };

    useEffect(() => {
        if (!messages) return;
        const newCount = messages.length;
        if (newCount > prevCount) {
            if (isNearBottom()) {
                scrollToBottom();
            } else {
                setShowScrollButton(true);
            }
        }
        setPrevCount(newCount);
    }, [messages?.length]);

    // Initial scroll to bottom
    useEffect(() => {
        if (messages && messages.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: "instant" });
        }
    }, []);

    const handleScroll = () => {
        if (isNearBottom()) setShowScrollButton(false);
    };

    if (messages === undefined) {
        return (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex items-end gap-2 animate-pulse",
                            i % 2 === 0 ? "flex-row" : "flex-row-reverse"
                        )}
                    >
                        <div className="w-7 h-7 rounded-full bg-slate-700 shrink-0" />
                        <div
                            className={cn(
                                "h-10 rounded-2xl bg-slate-700",
                                i % 2 === 0 ? "w-48" : "w-36"
                            )}
                        />
                    </div>
                ))}
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 text-slate-500" />
                </div>
                <div className="text-center">
                    <p className="text-slate-400 font-medium">No messages yet</p>
                    <p className="text-slate-600 text-sm mt-1">Say hello to start the conversation!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex-1 overflow-hidden">
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto px-4 py-4 space-y-3 scroll-smooth"
            >
                {messages.map((msg) => (
                    <MessageBubble
                        key={msg._id}
                        message={msg}
                        isOwn={msg.senderId === currentUserId}
                        currentUserId={currentUserId}
                        otherUserLastReadTime={otherUserLastReadTime}
                    />
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Scroll to bottom button */}
            {showScrollButton && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg transition-all animate-bounce-slow"
                >
                    <ChevronDown className="w-3.5 h-3.5" />
                    New messages
                </button>
            )}
        </div>
    );
}
