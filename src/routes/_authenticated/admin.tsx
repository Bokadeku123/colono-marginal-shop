import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Pencil, Trash2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CATEGORIAS, STATUS_PEDIDO, moeda } from "@/lib/format";
import type { Produto } from "@/components/ProductCard";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel administrativo — COLONO MARGINAL" },
      { name: "description", content: "Gestão de produtos, clientes e pedidos da loja." },
      { property: "og:title", content: "Painel administrativo — COLONO MARGINAL" },
      { property: "og:description", content: "Gestão de produtos, clientes e pedidos." },
    ],
  }),
  component: Admin,
});

type FormProduto = {
  id?: string;
  nome: string;
  categoria: string;
  preco: string;
  descricao: string;
  imagem_url: string;
  cores: string;
  tamanhos: string;
  estoque: string;
};

const formVazio: FormProduto = {
  nome: "",
  categoria: CATEGORIAS[0],
  preco: "",
  descricao: "",
  imagem_url: "",
  cores: "",
  tamanhos: "",
  estoque: "0",
};

function Admin() {
  const { isAdmin, carregando } = useAuth();
  const [aba, setAba] = useState<"produtos" | "clientes" | "pedidos">("produtos");

  if (carregando) {
    return <p className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted-foreground">Carregando...</p>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-4xl">ACESSO RESTRITO</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Esta área é exclusiva do administrador da loja.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl">PAINEL ADMIN</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["produtos", "clientes", "pedidos"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`rounded border px-4 py-2 text-xs font-semibold uppercase tracking-widest ${
              aba === a ? "border-foreground bg-primary text-primary-foreground" : "border-border"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {aba === "produtos" && <AbaProdutos />}
        {aba === "clientes" && <AbaClientes />}
        {aba === "pedidos" && <AbaPedidos />}
      </div>
    </div>
  );
}

function AbaProdutos() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormProduto>(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewImagem?.startsWith("blob:")) {
        URL.revokeObjectURL(previewImagem);
      }
    };
  }, [previewImagem]);

  const { data: produtos } = useQuery({
    queryKey: ["admin-produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Produto[];
    },
  });

  function selecionarImagem(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida.");
      event.target.value = "";
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5 MB.");
      event.target.value = "";
      return;
    }

    if (previewImagem?.startsWith("blob:")) {
      URL.revokeObjectURL(previewImagem);
    }

    setImagemArquivo(arquivo);
    setPreviewImagem(URL.createObjectURL(arquivo));
  }

  function limparFormulario() {
    if (previewImagem?.startsWith("blob:")) {
      URL.revokeObjectURL(previewImagem);
    }
    setForm(formVazio);
    setImagemArquivo(null);
    setPreviewImagem(null);
  }

  async function uploadImagem(arquivo: File) {
    const extensao = arquivo.name.split(".").pop()?.toLowerCase() || "jpg";
    const nomeArquivo = `${crypto.randomUUID()}.${extensao}`;
    const caminho = `camisas/${nomeArquivo}`;

    const { error } = await supabase.storage.from("produtos").upload(caminho, arquivo, {
      cacheControl: "3600",
      upsert: false,
      contentType: arquivo.type,
    });

    if (error) throw error;

    const { data } = supabase.storage.from("produtos").getPublicUrl(caminho);

    return { url: data.publicUrl, caminho };
  }

  async function excluirImagemStorage(url: string | null) {
    if (!url) return;

    const marcador = "/storage/v1/object/public/produtos/";
    const index = url.indexOf(marcador);
    if (index === -1) return;

    const caminho = url.substring(index + marcador.length);
    const { error } = await supabase.storage.from("produtos").remove([caminho]);

    if (error) {
      console.warn("Não foi possível remover a imagem antiga:", error.message);
    }
  }

  function editar(p: Produto) {
    setForm({
      id: p.id,
      nome: p.nome,
      categoria: p.categoria,
      preco: String(p.preco),
      descricao: p.descricao,
      imagem_url: p.imagem_url ?? "",
      cores: p.cores.join(", "),
      tamanhos: p.tamanhos.join(", "),
      estoque: String(p.estoque),
    });
    setImagemArquivo(null);
    setPreviewImagem(p.imagem_url ?? null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSalvando(true);

    let novaImagemUrl: string | null = form.imagem_url || null;
    let imagemEnviada: { url: string; caminho: string } | null = null;

    try {
      if (imagemArquivo) {
        imagemEnviada = await uploadImagem(imagemArquivo);
        novaImagemUrl = imagemEnviada.url;
      }

      const payload = {
        nome: form.nome.trim(),
        categoria: form.categoria,
        preco: Number(form.preco || 0),
        descricao: form.descricao.trim(),
        imagem_url: novaImagemUrl,
        cores: form.cores.split(",").map((s) => s.trim()).filter(Boolean),
        tamanhos: form.tamanhos.split(",").map((s) => s.trim()).filter(Boolean),
        estoque: Number(form.estoque || 0),
      };

      const result = form.id
        ? await supabase.from("products").update(payload).eq("id", form.id)
        : await supabase.from("products").insert(payload);

      if (result.error) throw result.error;

      if (form.id && imagemArquivo && form.imagem_url) {
        await excluirImagemStorage(form.imagem_url);
      }

      toast.success(form.id ? "Produto atualizado." : "Produto criado.");
      limparFormulario();

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-produtos"] }),
        queryClient.invalidateQueries({ queryKey: ["produtos"] }),
        queryClient.invalidateQueries({ queryKey: ["produtos-destaque"] }),
      ]);
    } catch (error) {
      if (imagemEnviada) {
        await supabase.storage.from("produtos").remove([imagemEnviada.caminho]);
      }

      console.error(error);
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o produto.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este produto?")) return;

    const produto = produtos?.find((p) => p.id === id);
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      toast.error("Não foi possível excluir.");
      return;
    }

    if (produto?.imagem_url) {
      await excluirImagemStorage(produto.imagem_url);
    }

    toast.success("Produto excluído.");

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-produtos"] }),
      queryClient.invalidateQueries({ queryKey: ["produtos"] }),
      queryClient.invalidateQueries({ queryKey: ["produtos-destaque"] }),
    ]);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <form onSubmit={salvar} className="h-fit space-y-3 rounded border border-border bg-card p-5">
        <h2 className="text-2xl">{form.id ? "EDITAR PRODUTO" : "NOVO PRODUTO"}</h2>

        <input
          className="field"
          placeholder="Nome"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          required
        />

        <select
          className="field"
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input
          className="field"
          type="number"
          step="0.01"
          min="0"
          placeholder="Preço"
          value={form.preco}
          onChange={(e) => setForm({ ...form, preco: e.target.value })}
          required
        />

        <textarea
          className="field"
          rows={3}
          placeholder="Descrição"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        />

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <ImagePlus size={17} />
            Foto da camisa
          </label>

          <input
            className="field"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={selecionarImagem}
          />

          {previewImagem ? (
            <div className="overflow-hidden rounded border border-border bg-muted">
              <img
                src={previewImagem}
                alt="Prévia do produto"
                className="h-64 w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded border border-dashed border-border text-sm text-muted-foreground">
              Nenhuma imagem selecionada
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            JPG, PNG ou WEBP • máximo 5 MB
          </p>
        </div>

        <input
          className="field"
          placeholder="Cores separadas por vírgula"
          value={form.cores}
          onChange={(e) => setForm({ ...form, cores: e.target.value })}
        />

        <input
          className="field"
          placeholder="Tamanhos separados por vírgula"
          value={form.tamanhos}
          onChange={(e) => setForm({ ...form, tamanhos: e.target.value })}
        />

        <input
          className="field"
          type="number"
          min="0"
          placeholder="Estoque"
          value={form.estoque}
          onChange={(e) => setForm({ ...form, estoque: e.target.value })}
        />

        <div className="flex gap-2">
          <button type="submit" disabled={salvando} className="btn btn-primary hover:opacity-85">
            {salvando ? "Enviando foto..." : form.id ? "Atualizar" : "Adicionar"}
          </button>

          {form.id && (
            <button type="button" className="btn btn-outline hover:bg-accent" onClick={limparFormulario}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {produtos?.map((p) => (
          <div key={p.id} className="flex items-center gap-4 rounded border border-border bg-card p-3">
            {p.imagem_url ? (
              <img
                src={p.imagem_url}
                alt={p.nome}
                loading="lazy"
                className="h-14 w-14 rounded object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded bg-muted text-muted-foreground">
                <ImagePlus size={18} />
              </div>
            )}

            <div className="flex-1">
              <p className="font-semibold">{p.nome}</p>
              <p className="text-xs text-muted-foreground">
                {p.categoria} • {moeda(Number(p.preco))} • estoque {p.estoque}
              </p>
            </div>

            <button onClick={() => editar(p)} aria-label="Editar">
              <Pencil size={16} className="text-muted-foreground hover:text-foreground" />
            </button>

            <button onClick={() => excluir(p.id)} aria-label="Excluir">
              <Trash2 size={16} className="text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AbaClientes() {
  const { data: clientes } = useQuery({
    queryKey: ["admin-clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, email, telefone, endereco, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-3">
      {clientes?.map((c) => (
        <div key={c.id} className="rounded border border-border bg-card p-4">
          <p className="font-semibold">{c.nome || "Sem nome"}</p>
          <p className="text-sm text-muted-foreground">{c.email}</p>
          {c.telefone && <p className="text-sm text-muted-foreground">{c.telefone}</p>}
          {c.endereco && <p className="text-sm text-muted-foreground">{c.endereco}</p>}
        </div>
      ))}
      {clientes?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum cliente ainda.</p>}
    </div>
  );
}

type PedidoAdmin = {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
  pagamento: string;
  total: number;
  status: string;
  created_at: string;
  order_items: {
    id: string;
    nome_produto: string;
    quantidade: number;
    cor: string | null;
    tamanho: string | null;
  }[];
};

function AbaPedidos() {
  const queryClient = useQueryClient();

  const { data: pedidos } = useQuery({
    queryKey: ["admin-pedidos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PedidoAdmin[];
    },
  });

  async function alterarStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      toast.error("Não foi possível alterar o status.");
      return;
    }
    toast.success("Status atualizado.");
    queryClient.invalidateQueries({ queryKey: ["admin-pedidos"] });
  }

  return (
    <div className="space-y-4">
      {pedidos?.map((p) => (
        <div key={p.id} className="rounded border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {new Date(p.created_at).toLocaleString("pt-BR")} • {p.pagamento}
            </span>
            <select
              className="field w-auto text-xs"
              value={p.status}
              onChange={(e) => alterarStatus(p.id, e.target.value)}
            >
              {STATUS_PEDIDO.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <p className="mt-2 font-semibold">{p.nome}</p>
          <p className="text-sm text-muted-foreground">
            {p.telefone} — {p.endereco}
          </p>
          <div className="mt-2 space-y-1 text-sm">
            {p.order_items.map((item) => (
              <p key={item.id}>
                {item.quantidade}x {item.nome_produto}
                {[item.cor, item.tamanho].filter(Boolean).length > 0
                  ? ` (${[item.cor, item.tamanho].filter(Boolean).join(" • ")})`
                  : ""}
              </p>
            ))}
          </div>
          <p className="mt-2 font-semibold">Total: {moeda(Number(p.total))}</p>
        </div>
      ))}
      {pedidos?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>}
    </div>
  );
}
