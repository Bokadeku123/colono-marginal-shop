import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag, User, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { CATEGORIAS } from "@/lib/format";

function Nav({ aoNavegar }: { aoNavegar?: () => void }) {
  return (
    <>
      <Link
        to="/catalogo"
        onClick={aoNavegar}
        className="text-sm font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
      >
        Tudo
      </Link>
      {CATEGORIAS.map((c) => (
        <Link
          key={c}
          to="/catalogo"
          search={{ categoria: c }}
          onClick={aoNavegar}
          className="text-sm font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          {c}
        </Link>
      ))}
    </>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { quantidadeTotal } = useCart();
  const { session, isAdmin } = useAuth();
  const [aberto, setAberto] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <button
            className="md:hidden"
            onClick={() => setAberto((a) => !a)}
            aria-label="Abrir menu"
          >
            {aberto ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/" className="font-display text-2xl leading-none tracking-wider">
            COLONO<span className="text-muted-foreground"> MARGINAL</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Nav />
          </nav>

          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground sm:block"
              >
                Painel
              </Link>
            )}
            <Link to={session ? "/perfil" : "/auth"} aria-label="Conta">
              <User size={20} />
            </Link>
            <Link to="/carrinho" className="relative" aria-label="Carrinho">
              <ShoppingBag size={20} />
              {quantidadeTotal > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {quantidadeTotal}
                </span>
              )}
            </Link>
          </div>
        </div>

        {aberto && (
          <nav className="flex flex-col gap-3 border-t border-border px-4 py-4 md:hidden">
            <Nav aoNavegar={() => setAberto(false)} />
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-xl tracking-wider text-foreground">
            COLONO MARGINAL
          </span>
          <span>© {new Date().getFullYear()} — Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
}
