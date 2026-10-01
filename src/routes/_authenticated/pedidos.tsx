import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { moeda } from "@/lib/format";

type ItemPedido = {
  id: string;
  nome_produto: string;
  preco: number;
  quantidade: number;
  cor: string | null;
  tamanho: string | null;
};

type Pedido = {
  id: string;
  total: number;
  status: string;
  pagamento: string;
  created_at: string;
  order_items: ItemPedido[];
};

export const Route = createFileRoute("/_authenticated/pedidos")({
  head: () => ({
    meta: [
      { title: "Meus pedidos — COLONO MARGINAL" },
      { name: "description", content: "Acompanhe o status dos seus pedidos." },
      { property: "og:title", content: "Meus pedidos — COLONO MARGINAL" },
      { property: "og:description", content: "Acompanhe o status dos seus pedidos." },
    ],
  }),
  component: Pedidos,
});

function Pedidos() {
  const { user } = useAuth();

  const { data: pedidos, isLoading } = useQuery({
    queryKey: ["pedidos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, status, pagamento, created_at, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Pedido[];
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl">MEUS PEDIDOS</h1>

      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Carregando...</p>
      ) : pedidos && pedidos.length > 0 ? (
        <div className="mt-8 space-y-4">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="rounded border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(pedido.created_at).toLocaleDateString("pt-BR")} • {pedido.pagamento}
                </span>
                <span className="rounded border border-border px-2 py-1 text-xs font-semibold uppercase tracking-widest">
                  {pedido.status}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                {pedido.order_items.map((item) => (
                  <p key={item.id}>
                    {item.quantidade}x {item.nome_produto}
                    <span className="text-muted-foreground">
                      {[item.cor, item.tamanho].filter(Boolean).length > 0
                        ? ` (${[item.cor, item.tamanho].filter(Boolean).join(" • ")})`
                        : ""}
                    </span>
                  </p>
                ))}
              </div>
              <p className="mt-3 font-semibold">Total: {moeda(Number(pedido.total))}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">Você ainda não fez nenhum pedido.</p>
      )}
    </div>
  );
}
