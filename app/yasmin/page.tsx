import React from "react";
import YasminUI from "@/components/YasminUI";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function YasminPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>
      </div>
      
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
          Talk to Yasmin
        </h1>
        <p className="text-zinc-400 max-w-md mx-auto">
          Your personal AI assistant. Speak naturally, and Yasmin will understand and respond.
        </p>
      </div>

      <YasminUI />
    </div>
  );
}
