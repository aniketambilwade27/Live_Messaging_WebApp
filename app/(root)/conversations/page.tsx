import { MessageSquare } from "lucide-react";

export default function ConversationsPage() {
    return (
        <div className="h-full flex flex-col items-center justify-center gap-4 bg-slate-950 text-center p-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-2xl shadow-violet-900/50">
                <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <div>
                <h2 className="text-xl font-semibold text-white">Welcome to LiveChat</h2>
                <p className="text-slate-400 text-sm mt-1 max-w-xs">
                    Select a conversation from the sidebar, or start a new chat to get going.
                </p>
            </div>
        </div>
    );
}
