"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, MessageSquare, Lightbulb } from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/app", icon: LayoutDashboard },
    { label: "Yasmin", href: "/app/yasmin", icon: User },
    { label: "Conversations", href: "/app/conversations", icon: MessageSquare },
    { label: "Ideas", href: "/app/ideas", icon: Lightbulb },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0a] border-t border-gray-800 flex items-center justify-around px-4 pb-safe z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === "/app" 
          ? pathname === "/app" 
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors ${
              isActive ? "text-blue-500" : "text-gray-500"
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 3 : 2} />
            <span className={`text-[10px] uppercase font-black tracking-widest ${isActive ? "opacity-100" : "opacity-50"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
