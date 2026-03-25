import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Navbar() {
  return (
    <div className="h-16 border-b flex items-center px-4 gap-4 bg-white sticky top-0 z-10">
      <SidebarTrigger />
      <h1 className="text-lg font-semibold">Admin Dashboard</h1>
    </div>
  );
}