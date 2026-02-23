import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all messages for a conversation, enriched with sender info and reactions
export const getMessages = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .order("asc")
            .collect();

        return await Promise.all(
            messages.map(async (msg) => {
                const sender = await ctx.db.get(msg.senderId);
                const reactions = await ctx.db
                    .query("reactions")
                    .withIndex("by_messageId", (q) => q.eq("messageId", msg._id))
                    .collect();

                // Group reactions by emoji — return as array (NOT object keys)
                // because emojis like ❤️ contain non-ASCII chars Convex rejects as field names
                const reactionMap: Record<string, { count: number; userIds: string[] }> = {};
                for (const r of reactions) {
                    if (!reactionMap[r.emoji]) {
                        reactionMap[r.emoji] = { count: 0, userIds: [] };
                    }
                    reactionMap[r.emoji].count++;
                    reactionMap[r.emoji].userIds.push(r.userId);
                }
                const reactionList = Object.entries(reactionMap).map(([emoji, data]) => ({
                    emoji,
                    count: data.count,
                    userIds: data.userIds,
                }));

                return {
                    ...msg,
                    sender,
                    reactions: reactionList,
                };
            })
        );
    },
});

// Send a message
export const sendMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        senderId: v.id("users"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: args.senderId,
            content: args.content,
            type: "text",
            isDeleted: false,
        });
    },
});

// Soft-delete a message
export const deleteMessage = mutation({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, { isDeleted: true });
    },
});

// Mark messages as read in a conversation
export const markConversationRead = mutation({
    args: {
        conversationId: v.id("conversations"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("readReceipts")
            .withIndex("by_conversationId_userId", (q) =>
                q.eq("conversationId", args.conversationId).eq("userId", args.userId)
            )
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { lastReadTime: Date.now() });
        } else {
            await ctx.db.insert("readReceipts", {
                conversationId: args.conversationId,
                userId: args.userId,
                lastReadTime: Date.now(),
            });
        }
    },
});

// Get last read time for a user in a conversation (for read receipts)
export const getReadReceipt = query({
    args: {
        conversationId: v.id("conversations"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const receipt = await ctx.db
            .query("readReceipts")
            .withIndex("by_conversationId_userId", (q) =>
                q.eq("conversationId", args.conversationId).eq("userId", args.userId)
            )
            .unique();
        return receipt?.lastReadTime ?? 0;
    },
});
