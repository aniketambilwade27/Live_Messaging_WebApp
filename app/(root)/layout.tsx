"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { useConversation } from "@/hooks/useConversation";
import { cn } from "@/lib/utils";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isActive } = useConversation();

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden">
            {/* Sidebar — hidden on mobile when a conversation is open */}
            <div
                className={cn(
                    "w-full md:w-80 md:shrink-0 flex flex-col",
                    isActive ? "hidden md:flex" : "flex"
                )}
            >
                <Sidebar />
            </div>

            {/* Main chat area */}
            <main
                className={cn(
                    "flex-1 flex flex-col",
                    isActive ? "flex" : "hidden md:flex"
                )}
            >
                {children}
            </main>
        </div>
    );
}
