"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface MessageInputProps {
    conversationId: Id<"conversations">;
    senderId: Id<"users">;
}

export function MessageInput({ conversationId, senderId }: MessageInputProps) {
    const [content, setContent] = useState("");
    const [sending, setSending] = useState(false);
    const sendMessage = useMutation(api.messages.sendMessage);
    const setTyping = useMutation(api.typing.setTyping);
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleTyping = () => {
        setTyping({ conversationId, userId: senderId });
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };

    const handleSend = async () => {
        if (!content.trim() || sending) return;
        const text = content.trim();
        setContent("");
        setSending(true);
        try {
            await sendMessage({ conversationId, senderId, content: text });
        } catch {
            toast.error("Failed to send message", {
                action: { label: "Retry", onClick: () => handleSend() },
            });
            setContent(text); // Restore on failure
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex items-center gap-2 p-3 border-t border-slate-700/50 bg-slate-900">
            <Input
                value={content}
                onChange={(e) => {
                    setContent(e.target.value);
                    handleTyping();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-violet-500"
                disabled={sending}
            />
            <Button
                onClick={handleSend}
                disabled={!content.trim() || sending}
                size="icon"
                className="bg-violet-600 hover:bg-violet-500 text-white shrink-0 disabled:opacity-40"
            >
                <Send className="w-4 h-4" />
            </Button>
        </div>
    );
}
