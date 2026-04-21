"use client";

import * as React from "react";
import { LayoutDashboard, Mic, Settings, Radio, Activity } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { SystemStatus } from "@/components/SystemStatus";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, description: "Overview" },
  { href: "/meetings", label: "Meetings", icon: Mic, description: "History" },
  { href: "/settings", label: "Settings", icon: Settings, description: "Configuration" },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar {...props} className="border-r border-white/[0.06]">
      {/* ── Brand header ─────────────────────────────────────────────── */}
      <SidebarHeader className="border-b border-white/[0.06] px-5 py-5">
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25 shrink-0">
            <Radio className="h-4 w-4 text-white" aria-hidden="true" />
            {/* Live dot */}
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-[--sidebar-background] bg-emerald-400" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-foreground/95">MeetingPi</span>
            <span className="text-[10px] font-medium text-muted-foreground/70 tracking-widest uppercase">Command Center</span>
          </div>
        </div>
      </SidebarHeader>

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[10px] font-semibold tracking-widest text-muted-foreground/50 uppercase mb-1">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <Link
                      href={item.href}
                      className={clsx(
                        "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                        isActive
                          ? "bg-primary/15 text-primary shadow-sm border border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <item.icon
                        className={clsx(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )}
                        aria-hidden="true"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className={clsx("text-sm font-medium leading-none", isActive ? "text-primary" : "")}>
                          {item.label}
                        </span>
                        <span className="mt-0.5 text-[10px] text-muted-foreground/60 leading-none">
                          {item.description}
                        </span>
                      </div>
                      {isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                      )}
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer: compact system status ────────────────────────────── */}
      <SidebarFooter className="border-t border-white/[0.06] p-3">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
          <div className="mb-2 flex items-center gap-2">
            <Activity className="h-3 w-3 text-muted-foreground/50" aria-hidden="true" />
            <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/50">
              System
            </span>
          </div>
          <SystemStatus compact />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
