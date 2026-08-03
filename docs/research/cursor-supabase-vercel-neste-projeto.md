# O que Cursor, Supabase e Vercel fazem neste álbum coletivo (e o que não confundir)

## Summary

Neste projeto (React + TypeScript + Vite, backend no Supabase, site no Vercel — conforme `AGENTS.md`), as três ferramentas têm papéis distintos no caminho **local → banco/storage → site no ar**. **Cursor** é o editor com agente de IA onde você escreve e testa o app no computador. **Supabase** é o backend na nuvem: banco Postgres, autenticação e armazenamento de arquivos (ex.: fotos dos convidados). **Vercel** publica o site na internet a partir do repositório Git, com deploys automáticos e rede global. Não misture: Cursor não hospeda o álbum; Vercel não é o lugar onde as fotos “moram” como banco/arquivo; Supabase não substitui o editor nem o deploy do frontend.

## Findings

### Cursor — onde se constrói o app (local)

- Cursor é um ambiente de edição baseado no código-base do VS Code, focado em experiência de programação com IA, mantendo um editor familiar. — https://cursor.com/docs/configuration/migrations/vscode
- O **Agent** do Cursor é o assistente que completa tarefas de código: edita arquivos, busca no projeto, roda comandos no terminal e pode usar o navegador para verificar a interface. — https://cursor.com/docs/agent/overview
- Checkpoints do Agent guardam snapshots locais das alterações do agente e **não substituem o Git**; a documentação recomenda Git para controle de versão permanente. — https://cursor.com/docs/agent/overview
- Neste fluxo: Cursor = ferramenta **no seu computador** para criar/alterar o código do álbum (páginas, formulários, integração com Supabase). Não é o servidor do site público nem o banco das fotos.

### Supabase — banco, auth e arquivos (backend)

- A documentação descreve o Supabase como plataforma de backend: **Database** (Postgres completo por projeto), **Auth**, **Storage** (arquivos grandes), Realtime e Edge Functions. — https://supabase.com/docs
- Cada projeto Supabase tem um Postgres de verdade (não só uma “abstração”); Auth, Storage, Realtime e Edge Functions se apoiam nesse banco. — https://supabase.com/docs/guides/database/overview e https://supabase.com/docs/guides/getting-started/architecture
- **Storage** serve para guardar e servir arquivos (imagens, vídeos, documentos), com controle de acesso fino (incluindo políticas no Postgres) e CDN. Adequado a conteúdo gerado por usuários — no álbum coletivo, o lugar natural das **fotos**. — https://supabase.com/docs/guides/storage
- **Auth** autentica usuários (senha, magic link, OAuth etc.) e se integra com Row Level Security (RLS) para autorizar quem pode ler/escrever dados e arquivos. — https://supabase.com/docs/guides/auth
- A API Storage é compatível com S3 e guarda **metadados** no Postgres; os bytes dos arquivos ficam no serviço de object storage do Supabase, não “dentro” do frontend na Vercel. — https://supabase.com/docs/guides/getting-started/architecture e https://supabase.com/docs/guides/storage
- Neste fluxo: Supabase = **dados e arquivos** do álbum (convidados, metadados, uploads). O app React fala com o Supabase pela internet; o Vercel só entrega o código da interface.

### Vercel — colocar o site no ar (hospedagem / deploy)

- Na Vercel, o fluxo típico é conectar o repositório Git: a cada push há deploy; branches de preview para testar; merge na branch de produção gera o site de produção. Também dá para deployar pela CLI (`vercel` / `vercel --prod`). — https://vercel.com/docs/git e https://vercel.com/docs/getting-started-with-vercel
- Ao fazer deploy, a Vercel detecta o framework, roda o build e separa assets estáticos e artefatos de compute; o site roda numa rede global próxima dos usuários. — https://vercel.com/docs/fundamentals/infrastructure
- **Vite** (stack deste projeto) está na lista de frontends com suporte zero-config na Vercel. — https://vercel.com/docs/frameworks/frontend
- A própria documentação da Vercel trata banco/storage como algo a **adicionar** (ex.: integração Marketplace, inclusive opção de instalar Supabase via CLI) — ou seja, hospedar o site e guardar dados/arquivos são preocupações diferentes. — https://vercel.com/docs/getting-started-with-vercel
- Neste fluxo: Vercel = **URL pública** do álbum (HTML/JS/CSS construídos a partir do Vite). Não substitui o Postgres nem o Storage do Supabase neste desenho do projeto.

### Como encaixam: local → banco/storage → site no ar

| Etapa | Ferramenta | O que acontece (visão de PM) |
|-------|------------|-----------------------------|
| 1. Local | **Cursor** (+ Vite no PC) | Você (ou o Agent) edita o código React/TypeScript e testa no browser local. |
| 2. Banco / storage | **Supabase** | Tabelas (ex.: álbum, convidados) e **buckets** de fotos; login se houver; regras de quem vê o quê. |
| 3. Site no ar | **Vercel** | Push no Git → build → site acessível na internet; o browser do convidado carrega o app e o app chama o Supabase. |

Ordem mental útil: **escrever no Cursor → persistir no Supabase → publicar na Vercel**. O convidado não usa Cursor; ele abre a URL da Vercel e, por trás, o app usa Supabase.

### O que NÃO confundir

- **Cursor ≠ hospedagem.** Editar no Cursor não coloca o álbum no ar. Publicar é papel da Vercel (via Git/CLI). — https://cursor.com/docs/agent/overview vs https://vercel.com/docs/git
- **Cursor ≠ banco de fotos.** O Agent mexe em arquivos do projeto no disco; fotos dos convidados vão para **Supabase Storage**, não para a pasta do editor. — https://supabase.com/docs/guides/storage
- **Checkpoints do Agent ≠ Git.** Checkpoints são rollback local do Agent; versionamento permanente é Git (e o deploy na Vercel segue o Git). — https://cursor.com/docs/agent/overview
- **Vercel ≠ “onde as fotos ficam.”** Vercel entrega o site (frontend). Arquivos do álbum e metadados ficam no **Supabase** neste projeto (`AGENTS.md`). A Vercel pode integrar storage de marketplace, mas isso é opcional e separado do papel de deploy. — https://vercel.com/docs/getting-started-with-vercel e https://supabase.com/docs
- **Supabase ≠ editor e ≠ deploy do frontend.** O dashboard/Studio do Supabase gerencia backend; não substitui Cursor para escrever a UI nem Vercel para servir o Vite. — https://supabase.com/docs/guides/getting-started/architecture
- **“CDN de fotos” (Supabase Storage) ≠ “CDN do site” (Vercel).** Ambos aceleram entrega na borda, mas um serve **arquivos do álbum**; o outro serve **páginas/assets do app**. — https://supabase.com/docs/guides/storage e https://vercel.com/docs/fundamentals/infrastructure
- **Preview da Vercel ≠ ambiente Supabase.** Preview é uma URL de teste do **frontend**; dados/arquivos continuam no projeto Supabase (a menos que se configure outro projeto/branch de backend — assunto aparte). — https://vercel.com/docs/git

### Contexto deste repositório

- Stack declarada em `AGENTS.md`: app **React + TypeScript + Vite**; dados de backend no **Supabase**; (neste ticket / convenção do projeto) hospedagem na **Vercel**.

## Open questions

- Quais variáveis de ambiente (URL/chave publishable do Supabase) já estão (ou devem estar) configuradas no projeto Vercel de produção vs preview?
- O álbum usará Auth do Supabase (convidados logados) ou uploads/links sem conta — isso muda as políticas RLS, mas não muda o papel de cada ferramenta acima.
- Há plano de Supabase Branching / projeto separado de staging, ou um único projeto Supabase compartilhado por preview e produção?
- Domínio customizado do casamento (ex.: `album.familia.com`) será apontado só na Vercel; confirmação de DNS fica fora do escopo desta nota.
)
