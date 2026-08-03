# Publicar a primeira fatia na Vercel

Passos para colocar o app no ar apontando ao Supabase (ticket #10).

## Já feito no projeto

1. Tabelas `casamentos`, `fotos`, `sessoes` + bucket privado `fotos-album`
2. Edge Function `album` (portão de senha / código dos noivos)
3. Rotas do app:
   - `/criar` — criar casamento
   - `/p/:slug` — link privado (senha → álbum)
   - `/a/:slug` — link público (só se publicado)
4. `vercel.json` reescreve rotas SPA para `index.html`

## Variáveis (local e Vercel)

Só estas duas no frontend (nunca `service_role`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Local: arquivo `.env` (já configurado).  
Vercel: Project → Settings → Environment Variables → Production + Preview → Redeploy.

Importante: no Vite essas vars entram **no build**. Na CLI use `--no-sensitive` (vars “Sensitive” da Vercel não ficam disponíveis no build e o app quebra com Erro 405).

## Deploy (CLI)

Com a CLI logada (`vercel whoami`):

```bash
vercel link --yes --project projeto-01
# env vars (já feitas nesta sessão):
# VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY em Production e Preview
vercel build --prod --yes
vercel deploy --prebuilt --prod --yes
```

URL de produção atual: https://projeto-01-ochre.vercel.app

Ou: conectar o repo no dashboard Vercel, colar as duas env vars, Deploy.

## Como validar a fatia

1. Abrir `/criar` no URL da Vercel
2. Criar casamento → copiar link privado
3. Entrar com a senha → enviar JPG/PNG
4. Código dos noivos → Publicar → abrir link público (só visualização)
5. Despublicar → público some; convidados continuam sem enviar (congelado)

## Segurança (lembrete)

Senhas e uploads passam pela Edge Function. O browser não fala direto com as tabelas.
