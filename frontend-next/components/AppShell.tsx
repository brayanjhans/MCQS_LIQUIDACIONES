"use client";
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useEffect } from 'react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== '/login') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
      }
    }
  }, [pathname, router]);

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
