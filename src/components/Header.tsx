"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User } from "lucide-react";

interface HeaderProps {
  variant?: "hero" | "compact";
  onLogoClick?: () => void;
}

export function Header({ variant = "hero", onLogoClick }: HeaderProps) {
  const { user, loading, signOut } = useAuth();

  const isCompact = variant === "compact";

  const logoSize = isCompact ? 32 : 40;

  const Logo = onLogoClick ? (
    <button
      onClick={onLogoClick}
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      <Image
        src="/spaceshare-removebg-preview.png"
        alt="SpaceShare"
        width={logoSize}
        height={logoSize}
        className="rounded-lg"
      />
      <span
        className={`font-${isCompact ? "semibold" : "bold"} text-gray-900 dark:text-gray-100 ${
          isCompact ? "text-xl" : "text-2xl"
        }`}
      >
        SpaceShare
      </span>
    </button>
  ) : (
    <Link href="/" className="flex items-center gap-2">
      <Image
        src="/spaceshare-removebg-preview.png"
        alt="SpaceShare"
        width={logoSize}
        height={logoSize}
        className="rounded-lg"
      />
      <span
        className={`font-${isCompact ? "semibold" : "bold"} text-gray-900 dark:text-gray-100 ${
          isCompact ? "text-xl" : "text-2xl"
        }`}
      >
        SpaceShare
      </span>
    </Link>
  );

  return (
    <header
      className={`flex items-center justify-between ${
        isCompact
          ? "border-b bg-white dark:bg-gray-900 dark:border-gray-800 px-4 py-3 shadow-sm"
          : "px-6 py-4"
      }`}
    >
      {Logo}
      <nav className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size={isCompact ? "sm" : "default"}>
            Dashboard
          </Button>
        </Link>
        <Link href="/list-space">
          <Button variant="ghost" size={isCompact ? "sm" : "default"}>
            List Your Space
          </Button>
        </Link>

        {loading ? (
          <Button
            size={isCompact ? "sm" : "default"}
            className="bg-green-600 hover:bg-green-700"
            disabled
          >
            ...
          </Button>
        ) : user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline max-w-[120px] truncate">
                {user.email}
              </span>
            </div>
            <Button
              variant="outline"
              size={isCompact ? "sm" : "default"}
              onClick={() => signOut()}
              className="gap-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        ) : (
          <Link href="/auth">
            <Button
              size={isCompact ? "sm" : "default"}
              className="bg-green-600 hover:bg-green-700"
            >
              Sign In
            </Button>
          </Link>
        )}
      </nav>
    </header>
  );
}
