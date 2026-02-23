import { mutation } from "./_generated/server";
import { v } from "convex/values";

const ALLOWED_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

// Toggle a reaction on a message
export const toggleReaction = mutation({
    args: {
        messageId: v.id("messages"),
        userId: v.id("users"),
        emoji: v.string(),
    },
    handler: async (ctx, args) => {
        if (!ALLOWED_EMOJIS.includes(args.emoji)) {
            throw new Error("Invalid emoji");
        }

        const existing = await ctx.db
            .query("reactions")
            .withIndex("by_messageId_userId", (q) =>
                q.eq("messageId", args.messageId).eq("userId", args.userId)
            )
            .filter((q) => q.eq(q.field("emoji"), args.emoji))
            .unique();

        if (existing) {
            // Remove the reaction (toggle off)
            await ctx.db.delete(existing._id);
        } else {
            // Add the reaction
            await ctx.db.insert("reactions", {
                messageId: args.messageId,
                userId: args.userId,
                emoji: args.emoji,
            });
        }
    },
});
