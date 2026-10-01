import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { moeda } from "@/lib/format";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — COLONO MARGINAL" },
      { name: "description", content: "Finalize seu pedido com PIX ou cartão." },
      { property: "og:title", content: "Checkout — COLONO MARGINAL" },
      { property: "og:description", content: "Finalize seu pedido com PIX ou cartão." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const navigate = useNavigate();
  const { user, carregando } = useAuth();
  const { itens, total, limpar } = useCart();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [pagamento, setPagamento] = useState<"PIX" | "Cartão">("PIX");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!carregando && !user) {
      toast.error("Entre na sua conta para finalizar a compra.");
      navigate({ to: "/auth" });
    }
  }, [carregando, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("nome, telefone, endereco")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setNome((v) => v || (data.nome ?? ""));
          setTelefone((v) => v || (data.telefone ?? ""));
          setEndereco((v) => v || (data.endereco ?? ""));
        }
      });
  }, [user]);

  async function finalizar(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (itens.length === 0) {
      toast.error("Seu carrinho está vazio.");
      return;
    }
    setEnviando(true);
    try {
      const { data: pedido, error } = await supabase
        .from("orders")
        .insert({ user_id: user.id, nome, telefone, endereco, pagamento, total })
        .select("id")
        .single();
      if (error) throw error;

      const { error: erroItens } = await supabase.from("order_items").insert(
        itens.map((item) => ({
          order_id: pedido.id,
          product_id: item.productId,
          nome_produto: item.nome,
          preco: item.preco,
          quantidade: item.quantidade,
          cor: item.cor,
          tamanho: item.tamanho,
        })),
      );
      if (erroItens) throw erroItens;

      limpar();
      toast.success("Pedido realizado com sucesso!");
      navigate({ to: "/pedidos" });
    } catch {
      toast.error("Não foi possível finalizar o pedido. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-2">
      <div>
        <h1 className="text-4xl">CHECKOUT</h1>
        <form onSubmit={finalizar} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Nome completo
            </label>
            <input className="field mt-1" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Telefone
            </label>
            <input
              className="field mt-1"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Endereço completo
            </label>
            <textarea
              className="field mt-1"
              rows={3}
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              required
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Pagamento
            </p>
            <div className="mt-2 flex gap-2">
              {(["PIX", "Cartão"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPagamento(p)}
                  className={`rounded border px-4 py-2 text-xs font-semibold uppercase tracking-widest ${
                    pagamento === p ? "border-foreground bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={enviando || itens.length === 0}
            className="btn btn-primary w-full hover:opacity-85"
          >
            {enviando ? "Enviando..." : `Confirmar pedido • ${moeda(total)}`}
          </button>
        </form>
      </div>

      <div className="h-fit rounded border border-border bg-card p-5">
        <h2 className="text-2xl">RESUMO</h2>
        <div className="mt-4 space-y-3">
          {itens.map((item, i) => (
            <div key={i} className="flex justify-between gap-3 text-sm">
              <span>
                {item.quantidade}x {item.nome}
                <span className="block text-xs text-muted-foreground">
                  {[item.cor, item.tamanho].filter(Boolean).join(" • ")}
                </span>
              </span>
              <span className="whitespace-nowrap">{moeda(item.preco * item.quantidade)}</span>
            </div>
          ))}
          {itens.length === 0 && <p className="text-sm text-muted-foreground">Carrinho vazio.</p>}
        </div>
        <div className="mt-5 flex justify-between border-t border-border pt-4 font-semibold">
          <span>Total</span>
          <span>{moeda(total)}</span>
        </div>
      </div>
    </div>
  );
}
