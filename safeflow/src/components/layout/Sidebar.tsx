"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  AlertTriangle,
  MapPin,
  BarChart3,
  Settings,
  Shield,
  Bell,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "Eventos", icon: AlertTriangle },
  { href: "/map", label: "Mapa ao Vivo", icon: MapPin },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const secondaryItems = [
  { href: "/alerts", label: "Alertas", icon: Bell },
  { href: "/upload", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Sidebar para Desktop (telas grandes) */}
      <aside className="hidden lg:flex flex-col w-[220px] min-h-screen border-r flex-shrink-0"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b"
          style={{ borderColor: "var(--border-subtle)" }}>
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(59,130,246,0.1) 100%)", border: "1px solid rgba(0,212,255,0.2)" }}>
            <Shield size={15} style={{ color: "var(--accent-cyan)" }} />
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full animate-pulse-glow"
              style={{ backgroundColor: "var(--accent-emerald)" }} />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Safe<span style={{ color: "var(--accent-cyan)" }}>Flow</span>
            </span>
            <div className="text-[10px] font-medium tracking-widest uppercase"
              style={{ color: "var(--text-muted)" }}>
              AI Traffic
            </div>
          </div>
        </div>

        {/* Links Principais */}
        <nav className="flex-1 px-3 pt-4 pb-2 space-y-0.5">
          <div className="mb-2 px-2">
            <span className="text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: "var(--text-muted)" }}>
              Principal
            </span>
          </div>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group relative",
                  active ? "text-white" : "hover:text-white"
                )}
                style={{
                  backgroundColor: active ? "rgba(0,212,255,0.05)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                }}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full"
                    style={{ backgroundColor: "var(--accent-cyan)" }} />
                )}
                <Icon size={15} style={{ color: active ? "var(--accent-cyan)" : "inherit" }} />
                <span>{label}</span>
                {active && <ChevronRight size={12} className="ml-auto opacity-40" />}
              </Link>
            );
          })}

          <div className="my-3 px-2 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            <span className="text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: "var(--text-muted)" }}>
              Sistema
            </span>
          </div>
          {secondaryItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 relative",
                  active ? "text-white" : "hover:text-white"
                )}
                style={{
                  backgroundColor: active ? "rgba(0,212,255,0.05)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                }}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full"
                    style={{ backgroundColor: "var(--accent-cyan)" }} />
                )}
                <Icon size={15} style={{ color: active ? "var(--accent-cyan)" : "inherit" }} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer de Status */}
        <div className="mx-3 mb-4 p-3 rounded-lg border"
          style={{ backgroundColor: "rgba(0,212,255,0.01)", borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-glow"
              style={{ backgroundColor: "var(--accent-emerald)" }} />
            <span className="text-[11px] font-semibold" style={{ color: "var(--accent-emerald)" }}>
              Sistema Ativo
            </span>
          </div>
          <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            16 câmeras monitorando
          </div>
          <div className="mt-2 h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--bg-elevated)" }}>
            <div className="h-full rounded-full"
              style={{ width: "73%", background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))" }} />
          </div>
        </div>
      </aside>

      {/* Menu Inferior Fixo Otimizado para Mobile e Tablet */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 border-t z-50 flex items-center justify-around px-2 shadow-2xl"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}>
        {[...navItems, secondaryItems[1]].map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors"
              style={{ color: active ? "var(--accent-cyan)" : "var(--text-secondary)" }}>
              <Icon size={16} className="mb-0.5" />
              <span className="scale-95">{label === "Configurações" ? "Config." : label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}