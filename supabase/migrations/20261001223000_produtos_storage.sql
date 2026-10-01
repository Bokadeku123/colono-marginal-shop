-- Storage para fotos dos produtos.
-- O bucket é público para que as imagens possam aparecer no catálogo.
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do update set public = excluded.public;

-- Administradores autenticados podem enviar imagens para o bucket.
create policy "admins podem enviar fotos de produtos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'produtos'
  and public.has_role(auth.uid(), 'admin')
);

-- As fotos podem ser visualizadas publicamente no catálogo.
create policy "fotos de produtos podem ser visualizadas"
on storage.objects
for select
to public
using (
  bucket_id = 'produtos'
);

-- Administradores podem substituir/atualizar objetos.
create policy "admins podem atualizar fotos de produtos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'produtos'
  and public.has_role(auth.uid(), 'admin')
)
with check (
  bucket_id = 'produtos'
  and public.has_role(auth.uid(), 'admin')
);

-- Administradores podem excluir fotos de produtos.
create policy "admins podem excluir fotos de produtos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'produtos'
  and public.has_role(auth.uid(), 'admin')
);
