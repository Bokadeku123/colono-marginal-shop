import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou cadastrar — COLONO MARGINAL" },
      { name: "description", content: "Acesse sua conta ou crie um cadastro na COLONO MARGINAL." },
      { property: "og:title", content: "Entrar ou cadastrar — COLONO MARGINAL" },
      { property: "og:description", content: "Acesse sua conta na COLONO MARGINAL." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/perfil" });
  }, [session, navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      if (modo === "cadastro") {
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { data: { nome } },
        });
        if (error) throw error;
        toast.success("Cadastro realizado!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
      }
      navigate({ to: "/perfil" });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : "";
      toast.error(
        mensagem.includes("Invalid login")
          ? "E-mail ou senha incorretos."
          : mensagem.includes("already registered")
            ? "Este e-mail já possui cadastro."
            : "Não foi possível concluir. Tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-4xl">{modo === "login" ? "ENTRAR" : "CRIAR CONTA"}</h1>

      <form onSubmit={enviar} className="mt-8 space-y-4">
        {modo === "cadastro" && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Nome
            </label>
            <input
              className="field mt-1"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
        )}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            E-mail
          </label>
          <input
            type="email"
            className="field mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Senha
          </label>
          <input
            type="password"
            className="field mt-1"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <button type="submit" disabled={enviando} className="btn btn-primary w-full hover:opacity-85">
          {enviando ? "Aguarde..." : modo === "login" ? "Entrar" : "Cadastrar"}
        </button>
      </form>

      <button
        onClick={() => setModo(modo === "login" ? "cadastro" : "login")}
        className="mt-6 text-sm text-muted-foreground underline"
      >
        {modo === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
      </button>
    </div>
  );
}
