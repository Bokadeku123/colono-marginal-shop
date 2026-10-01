import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type Produto } from "@/components/ProductCard";
import { CATEGORIAS } from "@/lib/format";

type Busca = { categoria?: string | undefined };

export const Route = createFileRoute("/catalogo")({
  validateSearch: (search: Record<string, unknown>): Busca => ({
    categoria: typeof search["categoria"] === "string" ? search["categoria"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Catálogo — COLONO MARGINAL" },
      { name: "description", content: "Todas as peças da COLONO MARGINAL em um só lugar." },
      { property: "og:title", content: "Catálogo — COLONO MARGINAL" },
      { property: "og:description", content: "Todas as peças da COLONO MARGINAL." },
    ],
  }),
  component: Catalogo,
});

function Catalogo() {
  const { categoria } = Route.useSearch();

  const { data: produtos, isLoading } = useQuery({
    queryKey: ["produtos", categoria ?? "todos"],
    queryFn: async () => {
      let consulta = supabase.from("products").select("*").order("created_at", { ascending: false });
      if (categoria) consulta = consulta.eq("categoria", categoria);
      const { data, error } = await consulta;
      if (error) throw error;
      return data as Produto[];
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl">{categoria ?? "CATÁLOGO"}</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          to="/catalogo"
          className={`rounded border px-3 py-1.5 text-xs font-semibold uppercase tracking-widest ${
            !categoria ? "border-foreground bg-primary text-primary-foreground" : "border-border"
          }`}
        >
          Tudo
        </Link>
        {CATEGORIAS.map((c) => (
          <Link
            key={c}
            to="/catalogo"
            search={{ categoria: c }}
            className={`rounded border px-3 py-1.5 text-xs font-semibold uppercase tracking-widest ${
              categoria === c ? "border-foreground bg-primary text-primary-foreground" : "border-border"
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      {isLoading ? (
        <p className="mt-10 text-sm text-muted-foreground">Carregando...</p>
      ) : produtos && produtos.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {produtos.map((p) => (
            <ProductCard key={p.id} produto={p} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-sm text-muted-foreground">Nenhum produto nesta categoria.</p>
      )}
    </div>
  );
}
