"use client";

import { Bell, Search, ChevronDown } from "lucide-react";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const now = new Date();
  const formatted = now.toLocaleDateString("pt-BR", {
    weekday: "short", day: "2-digit", month: "short",
  });

  return (
    <header 
      className="flex items-center justify-between border-b sticky top-0 z-40 bg-[var(--bg-base)]/80 backdrop-blur-md"
      style={{ 
        borderColor: "var(--border-subtle)", 
        paddingLeft: "32px", 
        paddingRight: "32px",
        height: "72px"
      }}
    >
      {/* Título e Subtítulo */}
      <div className="min-w-0 flex-1 mr-4 flex flex-col justify-center">
        <h1 className="text-base font-semibold tracking-tight text-[var(--text-primary)] leading-none">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs mt-1.5 text-[var(--text-secondary)] truncate max-w-[280px] sm:max-w-md lg:max-w-xl leading-none">
            {subtitle}
          </p>
        )}
      </div>

      {/* Ações da Direita */}
      <div className="flex items-center gap-4 flex-shrink-0 h-full">
        
        {/* BARRA DE BUSCA TOTALMENTE CORRIGIDA COM INLINE STYLES DE PROTEÇÃO */}
        <div className="relative hidden lg:flex items-center" style={{ height: "36px" }}>
          {/* Lupa isolada com segurança à esquerda */}
          <Search 
            size={14} 
            className="absolute text-[var(--text-muted)] pointer-events-none" 
            style={{ left: "12px" }}
          />
          
          <input 
            type="text" 
            placeholder="Buscar eventos..." 
            className="rounded-lg border text-xs w-64 xl:w-72 bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)] focus:bg-[var(--bg-elevated)] transition-all placeholder-[var(--text-muted)]"
            style={{ 
              height: "100%", 
              paddingLeft: "38px",  // Margem generosa à esquerda para o texto nunca tocar na lupa
              paddingRight: "54px"  // Margem generosa à direita para o texto nunca tocar no KBD badge
            }}
          />
          
          {/* Container isolado à direita alinhando o Badge KBD perfeitamente no centro vertical */}
          <div className="absolute top-0 bottom-0 flex items-center pointer-events-none" style={{ right: "10px" }}>
            <kbd className="text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded border bg-[var(--bg-base)] text-[var(--text-muted)] border-[var(--border-subtle)]">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Data Dinâmica Sóbria */}
        <div className="hidden md:flex items-center gap-2 px-3 h-9 rounded-lg text-xs font-medium border bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)]" />
          <span className="capitalize">{formatted}</span>
        </div>

        {/* Notificações */}
        <button className="relative flex items-center justify-center w-9 h-9 rounded-lg border bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors cursor-pointer">
          <Bell size={14} className="text-[var(--text-secondary)]" />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[var(--severity-critical)]" />
        </button>

        {/* Perfil Slim */}
        <button className="flex items-center gap-2 px-2.5 h-9 rounded-lg border bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors cursor-pointer">
          <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold bg-[var(--border-strong)] text-[var(--text-primary)]">
            A
          </div>
          <span className="text-xs font-medium hidden sm:block text-[var(--text-secondary)]">
            Admin
          </span>
          <ChevronDown size={12} className="text-[var(--text-muted)]" />
        </button>
      </div>
    </header>
  );
}