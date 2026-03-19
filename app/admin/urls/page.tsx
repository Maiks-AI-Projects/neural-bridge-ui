"use client";

import React, { useState, useEffect } from "react";
import { getPeople } from "@/lib/actions";
import Link from "next/link";
import { Link as LinkIcon, ExternalLink, Shield, User, Globe, Calendar } from "lucide-react";

export default function URLsPage() {
  const [people, setPeople] = useState<any[]>([]);
  
  useEffect(() => {
    getPeople().then(setPeople);
  }, []);

  // Base host for guest links - normally you'd get this from env or request header
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://nbui.mmc.onl";

  const adminLinks = [
    { name: "Kanban Dashboard", url: "/", description: "Primary living room interface", icon: Shield },
    { name: "User Management", url: "/admin/people", description: "Manage people, schedules, and presence", icon: User },
    { name: "Recurring Tasks", url: "/admin/recurring", description: "Manage task templates and automation", icon: Calendar },
    { name: "Approval UI", url: "/approval", description: "Audit and commit AI scheduling proposals", icon: Shield },
    { name: "System URLs", url: "/admin/urls", description: "This page - overview of all access points", icon: LinkIcon },
  ];

  const guestLinks = people
    .filter(p => p.guest_token)
    .map(p => ({
      name: `${p.name}'s Guest View`,
      url: `${baseUrl}/guest/${p.guest_token}`,
      description: `Mobile-optimized view for ${p.role}`,
      person: p.name,
      role: p.role
    }));

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <header className="mb-6 md:mb-12">
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic flex items-center gap-4">
          <Globe className="w-10 h-10 text-blue-500" />
          System Access
        </h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm mt-2">
          Central Registry of Neural Bridge Interfaces
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Admin Section */}
        <section>
          <h2 className="text-xl font-black uppercase tracking-widest text-zinc-600 mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Administrative Access
          </h2>
          <div className="space-y-4">
            {adminLinks.map(link => (
              <div key={link.url} className="group bg-zinc-900 border border-zinc-800 p-6 rounded-3xl hover:border-blue-500/50 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-zinc-800 p-3 rounded-2xl group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                      <link.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">{link.name}</h3>
                      <p className="text-zinc-500 font-medium text-sm">{link.description}</p>
                    </div>
                  </div>
                  <Link href={link.url} className="text-zinc-700 hover:text-white transition-colors">
                    <ExternalLink className="w-5 h-5" />
                  </Link>
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-800/50">
                  <code className="text-blue-400 font-mono text-xs bg-black px-3 py-1.5 rounded-lg border border-zinc-800">
                    {baseUrl}{link.url}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Guest Section */}
        <section>
          <h2 className="text-xl font-black uppercase tracking-widest text-zinc-600 mb-6 flex items-center gap-2">
            <User className="w-5 h-5" />
            Guest/Helper Links
          </h2>
          {guestLinks.length > 0 ? (
            <div className="space-y-4">
              {guestLinks.map(link => (
                <div key={link.url} className="group bg-zinc-900 border border-zinc-800 p-6 rounded-3xl hover:border-yellow-500/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-zinc-800 p-3 rounded-2xl group-hover:bg-yellow-500/10 group-hover:text-yellow-400 transition-colors text-zinc-400">
                        <LinkIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black uppercase tracking-tight">{link.name}</h3>
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-black uppercase border border-zinc-700">
                            {link.role}
                          </span>
                        </div>
                        <p className="text-zinc-500 font-medium text-sm">{link.description}</p>
                      </div>
                    </div>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-zinc-700 hover:text-white transition-colors">
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                  <div className="mt-4 pt-4 border-t border-zinc-800/50 flex flex-col gap-3">
                    <code className="text-yellow-500 font-mono text-xs bg-black px-3 py-1.5 rounded-lg border border-zinc-800 break-all">
                      {link.url}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(link.url)}
                      className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-yellow-500 transition-colors self-start"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-zinc-900 border-2 border-dashed border-zinc-800 p-12 rounded-3xl text-center">
              <p className="text-zinc-600 font-bold uppercase tracking-widest text-sm">No Guest Tokens Assigned</p>
              <Link href="/admin/people" className="text-blue-500 font-black uppercase text-xs mt-4 inline-block hover:underline">
                Go to User Management
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
