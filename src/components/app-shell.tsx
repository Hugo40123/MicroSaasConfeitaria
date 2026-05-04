"use client";

import clsx from "clsx";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Home,
  Package,
  Settings,
  Store,
  Users,
  WalletCards
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/app", label: "Resumo", icon: Home },
  { href: "/app/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/app/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/app/produtos", label: "Produtos", icon: Package },
  { href: "/loja/doce-maria", label: "Portal", icon: Store },
  { href: "/app/clientes", label: "Clientes", icon: Users },
  { href: "/app/financeiro", label: "Financeiro", icon: WalletCards },
  { href: "/app/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/app/configuracoes", label: "Ajustes", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegacao principal">
        <Link className="brand" href="/app">
          <span className="brand-mark">DM</span>
          <span className="brand-title">
            <strong>Doce Maria</strong>
            <span>Painel da loja</span>
          </span>
        </Link>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/app" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx("nav-item", active && "active")}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="main-area">{children}</main>
    </div>
  );
}
