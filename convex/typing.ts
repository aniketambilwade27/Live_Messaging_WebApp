import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const TYPING_THRESHOLD_MS = 2_000; // 2 seconds

// Called when a user is typing
export const setTyping = mutation({
    args: {
        conversationId: v.id("conversations"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversationId_userId", (q) =>
                q
                    .eq("conversationId", args.conversationId)
                    .eq("userId", args.userId)
            )
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { lastTyped: Date.now() });
        } else {
            await ctx.db.insert("typingIndicators", {
                conversationId: args.conversationId,
                userId: args.userId,
                lastTyped: Date.now(),
            });
        }
    },
});

// Get users currently typing in a conversation (excluding self)
export const getTypingUsers = query({
    args: {
        conversationId: v.id("conversations"),
        currentUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const threshold = Date.now() - TYPING_THRESHOLD_MS;
        const indicators = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversationId", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .collect();

        const active = indicators.filter(
            (t) => t.lastTyped > threshold && t.userId !== args.currentUserId
        );

        return await Promise.all(
            active.map(async (t) => {
                const user = await ctx.db.get(t.userId);
                return user;
            })
        );
    },
});
