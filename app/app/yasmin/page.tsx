import React from "react";
import YasminUI from "@/components/YasminUI";
import MobileNav from "@/components/MobileNav";

export default function MobileYasminPage() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center pb-24 px-4">
      <header className="mt-12 mb-6 text-center w-full">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
          Talk to Yasmin
        </h1>
        <p className="text-zinc-500 max-w-xs mx-auto text-sm font-medium">
          Speak naturally, and Yasmin will understand and respond to your requests.
        </p>
      </header>

      <div className="w-full max-w-md flex-1 mb-8 overflow-hidden">
        <YasminUI />
      </div>

      <MobileNav />
    </main>
  );
}
