"use client";

import { CityMap } from "@/components/map";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white font-bold">
            E
          </div>
          <span className="text-xl font-semibold text-gray-900">EcoSquare</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          <Button variant="ghost">List Your Space</Button>
          <Button>Sign In</Button>
        </nav>
      </header>

      {/* Main Map Area */}
      <main className="flex-1">
        <CityMap />
      </main>
    </div>
  );
}
