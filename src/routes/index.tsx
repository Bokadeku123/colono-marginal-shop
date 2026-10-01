import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type Produto } from "@/components/ProductCard";
import { CATEGORIAS } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "COLONO MARGINAL — Streetwear e Skate" },
      {
        name: "description",
        content:
          "Camisetas, moletons, calças, bonés e acessórios de rua. Peças pesadas para o corre diário.",
      },
      { property: "og:title", content: "COLONO MARGINAL — Streetwear e Skate" },
      {
        property: "og:description",
        content: "Camisetas, moletons, calças, bonés e acessórios de rua.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: produtos } = useQuery({
    queryKey: ["produtos-destaque"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data as Produto[];
    },
  });

  return (
    <div>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Streetwear • Skate
          </p>
          <h1 className="mt-4 text-5xl leading-none sm:text-7xl">
            RUA, SUOR
            <br />E ATITUDE.
          </h1>
          <p className="mt-5 max-w-md text-sm text-muted-foreground sm:text-base">
            Peças feitas para quem vive a rua. Corte oversized, tecidos pesados e estampas
            autorais.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/catalogo" className="btn btn-primary hover:opacity-85">
              Ver catálogo
            </Link>
            <Link
              to="/catalogo"
              search={{ categoria: "CAMISETAS" }}
              className="btn btn-outline hover:bg-accent"
            >
              Camisetas
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {CATEGORIAS.map((c) => (
            <Link
              key={c}
              to="/catalogo"
              search={{ categoria: c }}
              className="rounded border border-border bg-card px-4 py-6 text-center text-sm font-semibold uppercase tracking-widest transition-colors hover:border-foreground"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-6 text-3xl">NOVIDADES</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {produtos?.map((p) => <ProductCard key={p.id} produto={p} />)}
        </div>
      </section>
    </div>
  );
}
