"use client";

import { useParams } from "next/navigation";

export function useConversation() {
    const params = useParams();
    const conversationId = params?.conversationId as string | undefined;
    const isActive = !!conversationId;
    return { conversationId, isActive };
}
