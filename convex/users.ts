import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


// Sync user from Clerk to Convex after sign-in
export const upsertUser = mutation({
    args: {
        clerkId: v.string(),
        email: v.string(),
        username: v.string(),
        imageUrl: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                username: args.username,
                imageUrl: args.imageUrl,
                email: args.email,
            });
            return existing._id;
        }

        return await ctx.db.insert("users", {
            clerkId: args.clerkId,
            email: args.email,
            username: args.username,
            imageUrl: args.imageUrl,
        });
    },
});

// Get current user from Convex by Clerk ID
export const getCurrentUser = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();
    },
});

// Get all users except the current user
export const getUsers = query({
    args: { clerkId: v.string(), searchQuery: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const allUsers = await ctx.db.query("users").collect();
        const otherUsers = allUsers.filter((u) => u.clerkId !== args.clerkId);

        if (args.searchQuery && args.searchQuery.trim() !== "") {
            const lower = args.searchQuery.toLowerCase();
            return otherUsers.filter(
                (u) =>
                    u.username.toLowerCase().includes(lower) ||
                    u.email.toLowerCase().includes(lower)
            );
        }

        return otherUsers;
    },
});

// Get a user by their Convex ID
export const getUserById = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    },
});

// Get multiple users by their IDs (for group member display)
export const getParticipantsByIds = query({
    args: { userIds: v.array(v.id("users")) },
    handler: async (ctx, args) => {
        return await Promise.all(args.userIds.map((id) => ctx.db.get(id)));
    },
});
