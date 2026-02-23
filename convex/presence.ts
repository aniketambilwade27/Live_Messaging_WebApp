import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const ONLINE_THRESHOLD_MS = 30_000; // 30 seconds

// Update a user's presence (called every ~20s from the client)
export const updatePresence = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("presence")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { lastSeen: Date.now() });
        } else {
            await ctx.db.insert("presence", {
                userId: args.userId,
                lastSeen: Date.now(),
            });
        }
    },
});

// Get IDs of users who are currently online
export const getOnlineUserIds = query({
    args: {},
    handler: async (ctx) => {
        const threshold = Date.now() - ONLINE_THRESHOLD_MS;
        const presences = await ctx.db.query("presence").collect();
        return presences
            .filter((p) => p.lastSeen > threshold)
            .map((p) => p.userId);
    },
});
