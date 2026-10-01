import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { moeda } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import type { Produto } from "@/components/ProductCard";

export const Route = createFileRoute("/produto/$id")({
  head: () => ({
    meta: [
      { title: "Produto — COLONO MARGINAL" },
      { name: "description", content: "Detalhes do produto na loja COLONO MARGINAL." },
      { property: "og:title", content: "Produto — COLONO MARGINAL" },
      { property: "og:description", content: "Detalhes do produto na loja COLONO MARGINAL." },
    ],
  }),
  component: DetalheProduto,
});

function DetalheProduto() {
  const { id } = Route.useParams();
  const { adicionar } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cor, setCor] = useState<string | null>(null);
  const [tamanho, setTamanho] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(1);

  const { data: produto, isLoading } = useQuery({
    queryKey: ["produto", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Produto | null;
    },
  });

  const { data: favorito } = useQuery({
    queryKey: ["favorito", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("product_id", id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
  });

  if (isLoading) {
    return <p className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted-foreground">Carregando...</p>;
  }
  if (!produto) {
    return <p className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted-foreground">Produto não encontrado.</p>;
  }

  function validar(p: Produto) {
    if (p.estoque <= 0) {
      toast.error("Produto esgotado.");
      return false;
    }
    if (p.cores.length > 0 && !cor) {
      toast.error("Escolha uma cor.");
      return false;
    }
    if (p.tamanhos.length > 0 && !tamanho) {
      toast.error("Escolha um tamanho.");
      return false;
    }
    return true;
  }

  function aoAdicionar(irParaCarrinho: boolean) {
    if (!produto || !validar(produto)) return;
    adicionar({
      productId: produto.id,
      nome: produto.nome,
      preco: Number(produto.preco),
      imagem: produto.imagem_url,
      cor,
      tamanho,
      quantidade,
    });
    if (irParaCarrinho) {
      navigate({ to: "/carrinho" });
    } else {
      toast.success("Adicionado ao carrinho.");
    }
  }

  async function alternarFavorito() {
    if (!user) {
      toast.error("Entre na sua conta para favoritar.");
      navigate({ to: "/auth" });
      return;
    }
    if (favorito) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", id);
      toast.success("Removido dos favoritos.");
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, product_id: id });
      toast.success("Adicionado aos favoritos.");
    }
    queryClient.invalidateQueries({ queryKey: ["favorito", id, user.id] });
    queryClient.invalidateQueries({ queryKey: ["favoritos", user.id] });
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2">
      <div className="overflow-hidden rounded border border-border bg-muted">
        {produto.imagem_url ? (
          <img src={produto.imagem_url} alt={produto.nome} className="aspect-square w-full object-cover" />
        ) : (
          <div className="flex aspect-square items-center justify-center text-sm text-muted-foreground">
            Sem foto
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          {produto.categoria}
        </p>
        <h1 className="mt-2 text-4xl leading-none">{produto.nome}</h1>
        <p className="mt-3 text-2xl font-semibold">{moeda(Number(produto.preco))}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{produto.descricao}</p>

        {produto.cores.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cores</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {produto.cores.map((c) => (
                <button
                  key={c}
                  onClick={() => setCor(c)}
                  className={`rounded border px-3 py-1.5 text-xs font-semibold uppercase ${
                    cor === c ? "border-foreground bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {produto.tamanhos.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tamanhos</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {produto.tamanhos.map((t) => (
                <button
                  key={t}
                  onClick={() => setTamanho(t)}
                  className={`rounded border px-3 py-1.5 text-xs font-semibold uppercase ${
                    tamanho === t ? "border-foreground bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-5 text-sm text-muted-foreground">
          {produto.estoque > 0 ? `Estoque: ${produto.estoque} unidades` : "Produto esgotado"}
        </p>

        <div className="mt-5 flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Qtd
          </span>
          <div className="flex items-center rounded border border-border">
            <button className="px-3 py-1.5" onClick={() => setQuantidade((q) => Math.max(1, q - 1))}>
              −
            </button>
            <span className="w-8 text-center text-sm">{quantidade}</span>
            <button className="px-3 py-1.5" onClick={() => setQuantidade((q) => q + 1)}>
              +
            </button>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <button className="btn btn-primary hover:opacity-85" onClick={() => aoAdicionar(true)}>
            Comprar
          </button>
          <button className="btn btn-outline hover:bg-accent" onClick={() => aoAdicionar(false)}>
            Adicionar ao carrinho
          </button>
          <button className="btn btn-outline hover:bg-accent" onClick={alternarFavorito}>
            <Heart size={16} fill={favorito ? "currentColor" : "none"} />
            {favorito ? "Favoritado" : "Favoritar"}
          </button>
        </div>
      </div>
    </div>
  );
}
