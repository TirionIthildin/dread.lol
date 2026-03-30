"use client";

import { usePathname } from "next/navigation";

interface PageTransitionWrapperProps {
  children: React.ReactNode;
}

/**
 * Wraps page content so it fades in when the route changes.
 * Works alongside loading.tsx and View Transitions API for smooth navigation.
 */
export default function PageTransitionWrapper({ children }: PageTransitionWrapperProps) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="w-full flex flex-col items-center animate-fade-in">
      {children}
    </div>
  );
}
