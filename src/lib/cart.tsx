import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  nome: string;
  preco: number;
  imagem: string | null;
  cor: string | null;
  tamanho: string | null;
  quantidade: number;
};

type CartContextValue = {
  itens: CartItem[];
  adicionar: (item: CartItem) => void;
  remover: (index: number) => void;
  alterarQuantidade: (index: number, quantidade: number) => void;
  limpar: () => void;
  total: number;
  quantidadeTotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "cm_carrinho";

export function CartProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const bruto = localStorage.getItem(STORAGE_KEY);
      if (bruto) setItens(JSON.parse(bruto) as CartItem[]);
    } catch {
      /* ignora */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
    } catch {
      /* ignora */
    }
  }, [itens]);

  function adicionar(item: CartItem) {
    setItens((atual) => {
      const i = atual.findIndex(
        (x) => x.productId === item.productId && x.cor === item.cor && x.tamanho === item.tamanho,
      );
      if (i >= 0) {
        const copia = [...atual];
        copia[i] = { ...copia[i]!, quantidade: copia[i]!.quantidade + item.quantidade };
        return copia;
      }
      return [...atual, item];
    });
  }

  function remover(index: number) {
    setItens((atual) => atual.filter((_, i) => i !== index));
  }

  function alterarQuantidade(index: number, quantidade: number) {
    setItens((atual) =>
      atual.map((item, i) => (i === index ? { ...item, quantidade: Math.max(1, quantidade) } : item)),
    );
  }

  function limpar() {
    setItens([]);
  }

  const total = itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
  const quantidadeTotal = itens.reduce((soma, item) => soma + item.quantidade, 0);

  return (
    <CartContext.Provider
      value={{ itens, adicionar, remover, alterarQuantidade, limpar, total, quantidadeTotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro do CartProvider");
  return ctx;
}
