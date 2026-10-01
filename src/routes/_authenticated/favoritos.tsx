import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ProductCard, type Produto } from "@/components/ProductCard";

export const Route = createFileRoute("/_authenticated/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — COLONO MARGINAL" },
      { name: "description", content: "As peças que você salvou na COLONO MARGINAL." },
      { property: "og:title", content: "Favoritos — COLONO MARGINAL" },
      { property: "og:description", content: "As peças que você salvou." },
    ],
  }),
  component: Favoritos,
});

function Favoritos() {
  const { user } = useAuth();

  const { data: produtos, isLoading } = useQuery({
    queryKey: ["favoritos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("products(*)");
      if (error) throw error;
      return (data ?? [])
        .map((linha) => (linha as unknown as { products: Produto | null }).products)
        .filter((p): p is Produto => !!p);
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl">FAVORITOS</h1>
      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Carregando...</p>
      ) : produtos && produtos.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {produtos.map((p) => (
            <ProductCard key={p.id} produto={p} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">Você ainda não favoritou nenhuma peça.</p>
      )}
    </div>
  );
}
