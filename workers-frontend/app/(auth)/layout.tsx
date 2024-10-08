"use client"
import SideNav from "@/components/SideNav";
import { Toaster } from "@/components/ui/toaster"

export default function RouteLayout({ children }: { children: React.ReactNode }) {
    return (
      <div className="w-full h-full flex">
        <SideNav/>
        {children}
        <Toaster />
      </div>
    );
  }
  