export function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

export const CATEGORIAS = [
  "CAMISETAS",
  "MOLETONS",
  "CALÇAS",
  "BONÉS",
  "ACESSÓRIOS",
] as const;

export const STATUS_PEDIDO = [
  "pendente",
  "pago",
  "enviado",
  "entregue",
  "cancelado",
] as const;
