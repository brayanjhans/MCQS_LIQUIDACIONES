"use client";
import { usePathname } from 'next/navigation';
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't render sidebar/header on login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F5F9] dark:bg-slate-900 transition-colors duration-300">
      <Sidebar />
      <div className="relative flex flex-col flex-1 ml-[320px] overflow-x-hidden overflow-y-auto">
        <Header />
        <main className="w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
