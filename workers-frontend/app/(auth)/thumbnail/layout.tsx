"use client"
import { Toaster } from "@/components/ui/toaster"

export default function RouteLayout({ children }: { children: React.ReactNode }) {
    return (
      <div className="w-full min-h-screen h-screen border-border border-l-2">
        {children}
        <Toaster />
      </div>
    );
  }
  