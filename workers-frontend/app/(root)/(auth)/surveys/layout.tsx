"use client";

export default function RouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen h-full border-border border-l-2">
      {children}
    </div>
  );
}
