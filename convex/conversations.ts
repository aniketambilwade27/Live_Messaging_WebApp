import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all conversations for a user
export const getConversations = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const conversations = await ctx.db.query("conversations").collect();
        const userConversations = conversations.filter((c) =>
            c.participants.includes(args.userId)
        );

        const enriched = await Promise.all(
            userConversations.map(async (conv) => {
                // Get the other participant(s)
                const otherParticipantIds = conv.participants.filter(
                    (p) => p !== args.userId
                );
                const otherParticipants = await Promise.all(
                    otherParticipantIds.map((id) => ctx.db.get(id))
                );

                // Get last message
                const messages = await ctx.db
                    .query("messages")
                    .withIndex("by_conversationId", (q) =>
                        q.eq("conversationId", conv._id)
                    )
                    .order("desc")
                    .take(1);
                const lastMessage = messages[0] ?? null;

                // Get unread count
                const receipt = await ctx.db
                    .query("readReceipts")
                    .withIndex("by_conversationId_userId", (q) =>
                        q.eq("conversationId", conv._id).eq("userId", args.userId)
                    )
                    .unique();

                let unreadCount = 0;
                if (receipt) {
                    const allMessages = await ctx.db
                        .query("messages")
                        .withIndex("by_conversationId", (q) =>
                            q.eq("conversationId", conv._id)
                        )
                        .collect();
                    unreadCount = allMessages.filter(
                        (m) =>
                            m.senderId !== args.userId &&
                            m._creationTime > receipt.lastReadTime
                    ).length;
                } else {
                    // No receipt yet — all messages from others are unread
                    const allMessages = await ctx.db
                        .query("messages")
                        .withIndex("by_conversationId", (q) =>
                            q.eq("conversationId", conv._id)
                        )
                        .collect();
                    unreadCount = allMessages.filter(
                        (m) => m.senderId !== args.userId
                    ).length;
                }

                return {
                    ...conv,
                    otherParticipants: otherParticipants.filter(Boolean),
                    lastMessage,
                    unreadCount,
                };
            })
        );

        // Sort by last message time, newest first
        return enriched.sort((a, b) => {
            const aTime = a.lastMessage?._creationTime ?? a._creationTime;
            const bTime = b.lastMessage?._creationTime ?? b._creationTime;
            return bTime - aTime;
        });
    },
});

// Get or create a 1:1 conversation
export const getOrCreateConversation = mutation({
    args: {
        currentUserId: v.id("users"),
        otherUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("conversations").collect();
        const found = existing.find(
            (c) =>
                !c.isGroup &&
                c.participants.includes(args.currentUserId) &&
                c.participants.includes(args.otherUserId) &&
                c.participants.length === 2
        );
        if (found) return found._id;

        return await ctx.db.insert("conversations", {
            participants: [args.currentUserId, args.otherUserId],
            isGroup: false,
        });
    },
});

// Create a group conversation
export const createGroupConversation = mutation({
    args: {
        participantIds: v.array(v.id("users")),
        groupName: v.string(),
        createdBy: v.id("users"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("conversations", {
            participants: args.participantIds,
            isGroup: true,
            groupName: args.groupName,
            createdBy: args.createdBy,
        });
    },
});

// Get conversation by ID
export const getConversation = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.conversationId);
    },
});

// Delete a conversation and all related data
export const deleteConversation = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const { conversationId } = args;

        // Delete all messages in the conversation
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
            .collect();
        for (const msg of messages) {
            // Delete reactions for each message
            const reactions = await ctx.db
                .query("reactions")
                .withIndex("by_messageId", (q) => q.eq("messageId", msg._id))
                .collect();
            for (const r of reactions) await ctx.db.delete(r._id);
            await ctx.db.delete(msg._id);
        }

        // Delete typing indicators
        const typingRecords = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
            .collect();
        for (const t of typingRecords) await ctx.db.delete(t._id);

        // Delete read receipts
        const allReceipts = await ctx.db.query("readReceipts").collect();
        const convReceipts = allReceipts.filter((r) => r.conversationId === conversationId);
        for (const r of convReceipts) await ctx.db.delete(r._id);

        // Delete the conversation itself
        await ctx.db.delete(conversationId);
    },
});
