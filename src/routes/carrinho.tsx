import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { moeda } from "@/lib/format";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho — COLONO MARGINAL" },
      { name: "description", content: "Revise as peças do seu carrinho antes de finalizar." },
      { property: "og:title", content: "Carrinho — COLONO MARGINAL" },
      { property: "og:description", content: "Revise as peças do seu carrinho." },
    ],
  }),
  component: Carrinho,
});

function Carrinho() {
  const { itens, remover, alterarQuantidade, total } = useCart();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-4xl">CARRINHO</h1>

      {itens.length === 0 ? (
        <div className="mt-8">
          <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
          <Link to="/catalogo" className="btn btn-primary mt-5 hover:opacity-85">
            Ver catálogo
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 space-y-4">
            {itens.map((item, i) => (
              <div
                key={`${item.productId}-${item.cor}-${item.tamanho}-${i}`}
                className="flex gap-4 rounded border border-border bg-card p-4"
              >
                {item.imagem && (
                  <img
                    src={item.imagem}
                    alt={item.nome}
                    loading="lazy"
                    className="h-20 w-20 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{item.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {[item.cor, item.tamanho].filter(Boolean).join(" • ")}
                  </p>
                  <p className="mt-1 text-sm">{moeda(item.preco)}</p>
                  <div className="mt-2 flex items-center rounded border border-border w-fit">
                    <button className="px-2.5 py-1" onClick={() => alterarQuantidade(i, item.quantidade - 1)}>
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantidade}</span>
                    <button className="px-2.5 py-1" onClick={() => alterarQuantidade(i, item.quantidade + 1)}>
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => remover(i)} aria-label="Remover">
                    <Trash2 size={18} className="text-muted-foreground hover:text-destructive" />
                  </button>
                  <p className="font-semibold">{moeda(item.preco * item.quantidade)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
            <span className="text-lg font-semibold uppercase tracking-widest">Total</span>
            <span className="text-2xl font-bold">{moeda(total)}</span>
          </div>

          <Link to="/checkout" className="btn btn-primary mt-6 w-full hover:opacity-85">
            Finalizar compra
          </Link>
        </>
      )}
    </div>
  );
}
