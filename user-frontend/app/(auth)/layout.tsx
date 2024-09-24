import SideNav from "@/components/SideNav";

export default function RouteLayout({ children }: { children: React.ReactNode }) {
    return (
      <div className="flex">
        <SideNav/>
        {children}
      </div>
    );
  }
  