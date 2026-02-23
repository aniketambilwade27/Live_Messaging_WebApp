"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";

export function useCurrentConvexUser() {
    const { user, isLoaded } = useUser();
    const upsertUser = useMutation(api.users.upsertUser);

    const convexUser = useQuery(
        api.users.getCurrentUser,
        user ? { clerkId: user.id } : "skip"
    );

    useEffect(() => {
        if (!isLoaded || !user) return;
        upsertUser({
            clerkId: user.id,
            email: user.emailAddresses[0]?.emailAddress ?? "",
            username: user.fullName ?? user.username ?? user.firstName ?? "User",
            imageUrl: user.imageUrl,
        });
    }, [user, isLoaded, upsertUser]);

    return { convexUser, isLoaded };
}
