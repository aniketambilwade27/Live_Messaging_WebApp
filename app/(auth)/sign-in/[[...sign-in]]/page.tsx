import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <SignIn />
        </main>
    );
}
