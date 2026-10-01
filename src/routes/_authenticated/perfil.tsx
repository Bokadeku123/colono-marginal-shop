import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Minha conta — COLONO MARGINAL" },
      { name: "description", content: "Gerencie seus dados, pedidos e favoritos." },
      { property: "og:title", content: "Minha conta — COLONO MARGINAL" },
      { property: "og:description", content: "Gerencie seus dados, pedidos e favoritos." },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const { user, isAdmin, sair } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("nome, telefone, endereco")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setNome(data.nome ?? "");
          setTelefone(data.telefone ?? "");
          setEndereco(data.endereco ?? "");
        }
      });
  }, [user]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSalvando(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, nome, telefone, endereco, email: user.email ?? null });
    setSalvando(false);
    if (error) toast.error("Não foi possível salvar.");
    else toast.success("Dados atualizados.");
  }

  async function sairDaConta() {
    await sair();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-4xl">MINHA CONTA</h1>
      <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/pedidos" className="btn btn-outline hover:bg-accent">
          Meus pedidos
        </Link>
        <Link to="/favoritos" className="btn btn-outline hover:bg-accent">
          Favoritos
        </Link>
        <Link to="/carrinho" className="btn btn-outline hover:bg-accent">
          Carrinho
        </Link>
        {isAdmin && (
          <Link to="/admin" className="btn btn-outline hover:bg-accent">
            Painel admin
          </Link>
        )}
      </div>

      <form onSubmit={salvar} className="mt-8 space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Nome
          </label>
          <input className="field mt-1" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Telefone
          </label>
          <input className="field mt-1" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Endereço
          </label>
          <textarea
            className="field mt-1"
            rows={3}
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
          />
        </div>
        <button type="submit" disabled={salvando} className="btn btn-primary hover:opacity-85">
          {salvando ? "Salvando..." : "Salvar dados"}
        </button>
      </form>

      <button onClick={sairDaConta} className="btn btn-outline mt-10 hover:bg-accent">
        Sair
      </button>
    </div>
  );
}
