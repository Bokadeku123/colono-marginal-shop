# Upload de fotos dos produtos

Este projeto foi atualizado para permitir selecionar a foto da camisa diretamente no painel administrativo.

## O que foi alterado

- O campo de URL da imagem foi substituído por seleção de arquivo.
- A imagem aparece em prévia antes do cadastro.
- A imagem é enviada para o Supabase Storage no bucket `produtos`.
- Os arquivos ficam organizados em `camisas/`.
- A URL pública da imagem continua sendo salva em `products.imagem_url`.
- Ao editar um produto, é possível trocar a foto.
- Ao excluir um produto, a foto do Storage também é removida quando ela pertence ao bucket `produtos`.
- Ao trocar uma foto, a imagem anterior é removida.
- Imagens JPG, PNG e WEBP de até 5 MB são aceitas.

## Configuração do Supabase

Foi adicionada a migration:

`supabase/migrations/20261001223000_produtos_storage.sql`

Ela cria/configura o bucket público `produtos` e as políticas para administradores autenticados.

Se o projeto estiver conectado ao Supabase/Lovable com migrations automáticas, aplique essa migration. Caso esteja usando o painel do Supabase, também é possível copiar o conteúdo dessa migration para o SQL Editor.

## Rodar no VS Code

Na pasta do projeto:

```bash
bun install
bun run dev
```

Para verificar a compilação:

```bash
bun run build
```
