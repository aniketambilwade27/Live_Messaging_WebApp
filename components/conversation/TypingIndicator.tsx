"use client";

interface TypingIndicatorProps {
    names: string[];
}

export function TypingIndicator({ names }: TypingIndicatorProps) {
    if (names.length === 0) return null;

    const label =
        names.length === 1
            ? `${names[0]} is typing`
            : names.length === 2
                ? `${names[0]} and ${names[1]} are typing`
                : "Several people are typing";

    return (
        <div className="flex items-center gap-2 px-4 py-1.5 text-slate-500 text-xs">
            <div className="flex gap-0.5 items-center">
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                    />
                ))}
            </div>
            <span>{label}...</span>
        </div>
    );
}
