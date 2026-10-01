import { Link } from "@tanstack/react-router";
import { moeda } from "@/lib/format";

export type Produto = {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  imagem_url: string | null;
  cores: string[];
  tamanhos: string[];
  estoque: number;
};

export function ProductCard({ produto }: { produto: Produto }) {
  return (
    <Link
      to="/produto/$id"
      params={{ id: produto.id }}
      className="group block overflow-hidden rounded border border-border bg-card transition-colors hover:border-foreground"
    >
      <div className="aspect-square overflow-hidden bg-muted">
        {produto.imagem_url ? (
          <img
            src={produto.imagem_url}
            alt={produto.nome}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Sem foto
          </div>
        )}
      </div>
      <div className="space-y-1 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {produto.categoria}
        </p>
        <h3 className="text-lg leading-tight">{produto.nome}</h3>
        <p className="text-sm font-semibold">{moeda(Number(produto.preco))}</p>
        {produto.estoque <= 0 && (
          <p className="text-xs font-semibold uppercase text-destructive">Esgotado</p>
        )}
      </div>
    </Link>
  );
}
