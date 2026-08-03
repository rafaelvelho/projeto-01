# Qual é o caminho recomendado no Supabase (tabelas + Storage + políticas) para um único casamento com senha compartilhada, upload de JPG/PNG e listagem do álbum?

## Summary

Para v1 (um casamento, senha compartilhada, upload JPG/PNG e álbum coletivo), a documentação oficial do Supabase aponta para: **Postgres + RLS** para metadados, **Storage com bucket e políticas em `storage.objects`** para as fotos, e **chave publishable/`anon` só no frontend Vite** — nunca a secret/`service_role`. A “senha do casamento” **não é um produto pronto** do Auth: as opções documentadas são (a) tratar a senha via lógica no servidor (Edge Function e/ou RPC com cuidado), (b) um check pré-request na Data API com chave de app no header, ou (c) reutilizar Auth com senha (conta compartilhada) — cada uma com trade-offs. Abrir INSERT/SELECT para `anon` sem outro controle é possível na API, mas **arriscado**, porque a chave do frontend é pública.

## Findings

### Chaves: o que vai no Vite e o que nunca vai

- A chave **publishable** (`sb_publishable_...`) ou a legado **`anon`** identifica o app no browser; é segura de expor **somente** se RLS e grants estiverem corretos. Com publishable e usuário **não** logado, o Postgres usa o role `anon`; com usuário logado via Auth, usa `authenticated`. — https://supabase.com/docs/guides/getting-started/api-keys
- Chaves **secret** (`sb_secret_...`) / legado **`service_role`** dão acesso elevado e **bypassam RLS** (`BYPASSRLS`). Devem ficar só em backend (Edge Functions, servidores, jobs). **Nunca** no Vite, no bundle, em URL, nem no browser (mesmo em localhost). — https://supabase.com/docs/guides/getting-started/api-keys e https://supabase.com/docs/guides/database/secure-data
- Para o frontend Vite: criar o client com URL do projeto + publishable/`anon`. Toda autorização real precisa ser RLS/grants (ou lógica no servidor), não “esconder” a senha no React. — https://supabase.com/docs/guides/database/secure-data

### Storage: bucket de imagens JPG/PNG

- Buckets organizam arquivos e definem o modelo de acesso; restrições de **tipo MIME** e **tamanho máximo** são configuradas no bucket (`allowedMimeTypes`, `fileSizeLimit`). Exemplo oficial: só imagens e até 1MB com `allowedMimeTypes: ['image/*']` e `fileSizeLimit: '1MB'`. Para este produto, restringir a `image/jpeg` e `image/png` (ou `image/*` se aceitar a família image) é o mecanismo documentado no bucket. — https://supabase.com/docs/guides/storage/buckets/creating-buckets e https://supabase.com/docs/guides/storage/buckets/fundamentals
- Buckets são **privados por padrão**. Em bucket **privado**, download exige JWT + RLS ou URL assinada (`createSignedUrl`). Em bucket **público**, quem tiver a URL do arquivo consegue ler; upload/delete/move ainda passam por RLS. Públicos têm CDN mais agressiva. — https://supabase.com/docs/guides/storage/buckets/fundamentals e https://supabase.com/docs/guides/storage/serving/downloads
- Sem políticas RLS em `storage.objects`, **não há upload**. É preciso criar políticas de INSERT (e, na prática, SELECT espelhando o INSERT, porque o Storage faz `INSERT … RETURNING` e falha sem SELECT). — https://supabase.com/docs/guides/storage/security/access-control e https://supabase.com/docs/guides/troubleshooting/storage-error-403-forbidden-new-row-violates-row-level-security-policy-on-upload-a94384
- Upload padrão no client: `supabase.storage.from('bucket').upload(path, file)` (recomendado até ~6MB; acima, docs sugerem TUS). É possível passar `contentType: 'image/jpeg'`. — https://supabase.com/docs/guides/storage/uploads/standard-uploads
- Listagem de arquivos no bucket: `storage.from(...).list(...)` (sujeito a RLS). Para álbum, a alternativa comum é **listar metadados numa tabela Postgres** e montar URLs públicas ou assinadas a partir do path. — https://supabase.com/docs/reference/javascript/storage-from-list e https://supabase.com/docs/guides/storage/serving/downloads
- Service key no Storage bypassa RLS; não compartilhar publicamente. — https://supabase.com/docs/guides/storage/security/access-control
- Docs mencionam assinar URLs limitadas no tempo **no servidor, por exemplo com Edge Functions**, para buckets privados. — https://supabase.com/docs/guides/storage/serving/downloads

**Implicação para o álbum (leitura de docs, não decisão de produto):** bucket dedicado (ex.: `fotos-album`) com MIME JPG/PNG e limite de tamanho; escolher público (simplicidade + CDN, URL “vazável”) vs privado (exige sessão Auth ou signed URLs). Upload e listagem precisam de políticas explícitas em `storage.objects` (e/ou metadados em tabela).

### Tabelas mínimas sugeridas (proposta de pesquisa — **não é decisão de schema**)

> **Proposta apenas** para alimentar grilling/ADR depois. Nomes alinhados ao glossário de `CONTEXT.md` (`casamento`, `foto`). Não foram criadas no projeto.

Sugestão mínima:

| Tabela (proposta) | Colunas sugeridas (proposta) | Papel |
|-------------------|------------------------------|--------|
| `casamentos` | `id` (uuid), `nome`, `data` (date), `descricao_romantica` (text), `senha_hash` ou referência a segredo (ver senha abaixo), `created_at` | Um registro na v1 = o casamento |
| `fotos` | `id` (uuid), `casamento_id` (FK), `storage_path` (text), `created_at`; opcional: `content_type`, `tamanho_bytes` | Metadados do álbum; bytes no Storage |

- Persistência de domínio fica em **Postgres**; arquivos grandes em **Storage**; metadados no Postgres e bytes no object storage é o modelo da arquitetura Supabase. — https://supabase.com/docs/guides/getting-started/architecture e https://supabase.com/docs/guides/storage
- Tabelas expostas na Data API precisam de **grants** + **RLS ligado**; sem RLS, qualquer role com grant pode acessar. Funções **não** são protegidas por RLS da mesma forma — só por `EXECUTE` e revisão de `SECURITY DEFINER`. — https://supabase.com/docs/guides/api/securing-your-api
- **Não** guardar a senha em texto puro numa coluna legível via `anon` SELECT. Se a senha for coluna, usar hash e negar SELECT da coluna sensível (ou não expor a coluna / tabela de segredo via API). Column Level Security e schemas privados são caminhos documentados para restringir exposição. — https://supabase.com/docs/guides/database/column-level-security e https://supabase.com/docs/guides/api/securing-your-api (exemplo de tabela em schema `private`)

### Senha compartilhada sem login por convidado: o que a docs permite vs o que é arriscado

O produto quer **senha do casamento** (segredo compartilhado), não conta individual. O Auth do Supabase distingue: **API key** = *o que* acessa o projeto; **Auth** = *quem* acessa. — https://supabase.com/docs/guides/getting-started/api-keys

Não há, na documentação oficial consultada, um produto chamado “shared wedding password” ou API dedicada a “senha de evento”. Opções **documentadas** que se aproximam:

#### 1) Políticas abertas para `anon` + checagem só no React — **possível na API, inseguro como “senha”**

- RLS pode permitir `TO anon` com `USING (true)` / `WITH CHECK (true)` (exemplos de políticas permissivas existem no guia de RLS e de Storage). — https://supabase.com/docs/guides/database/postgres/row-level-security e https://supabase.com/docs/guides/storage/security/access-control
- A chave publishable/`anon` **não** protege contra quem copia a chave do Network inspector ou do bundle. A proteção deve ser RLS (e grants). — https://supabase.com/docs/guides/getting-started/api-keys
- **Risco:** se INSERT/SELECT de fotos e Storage estiverem abertos para `anon`, qualquer pessoa com a chave do projeto (pública) sobe/lista fotos **sem** a senha. Validar a senha só na UI **não** é controle de segurança segundo o modelo da docs.

#### 2) Pre-request na Data API com chave de app no header — **documentado para apps sem Auth**

- O guia de API descreve apps que **não usam Supabase Auth** e dependem do role `anon`, exigindo um header custom (ex.: `x-app-api-key`) conferido numa tabela `private.anon_api_keys` antes de cada request da Data API (`pgrst.db_pre_request`). — https://supabase.com/docs/guides/api/securing-your-api
- **Limitação oficial:** `db_pre_request` vale **só para a Data API (PostgREST)** — **não** cobre Storage, Realtime etc. Para Storage, a docs diz que é preciso chamar a mesma lógica **dentro das policies RLS** (com custo de performance). — https://supabase.com/docs/guides/api/securing-your-api
- Encaixe possível com “senha do casamento”: tratar a senha (ou um token derivado) como essa chave de app distribuída no link. Isso é **interpretação de produto** sobre o padrão de API key; a docs fala em API keys de aplicação, não em “senha de casamento”.

#### 3) Auth com email + senha (conta compartilhada) — **API oficial de senha**

- Auth com senha está documentado (`signUp` / `signInWithPassword` com email ou telefone). Após login, o client usa role `authenticated` e JWT nas policies. — https://supabase.com/docs/guides/auth/passwords e https://supabase.com/docs/guides/getting-started/api-keys
- **Trade-off de produto:** todos os convidados compartilhariam o **mesmo** usuário Auth (mesmo email+senha). É “senha compartilhada” tecnicamente via Auth, mas **é** login Auth (confirmação de email, sessão, rate limits). Não inventamos outro endpoint: só o fluxo de password Auth.

#### 4) Anonymous Sign-Ins — **JWT sem PII, mas sem senha sozinha**

- `signInAnonymously()` cria usuário anônimo com role `authenticated` e claim `is_anonymous`. Serve para experiência autenticada sem email/senha. — https://supabase.com/docs/guides/auth/auth-anonymous
- **Não** implementa sozinho a “senha do casamento”. Docs recomendam CAPTCHA/Turnstile e rate limit contra abuso. — https://supabase.com/docs/guides/auth/auth-anonymous
- Pode combinar com um gate servidor (abaixo) se o desenho exigir JWT + policies `authenticated`.

#### 5) Edge Function como portão da senha — **padrão servidor documentado**

- Edge Functions colocam lógica TypeScript entre o client e o banco; podem usar secrets e client com privilégio de serviço **só no servidor**. — https://supabase.com/docs/guides/database/secure-data e https://supabase.com/docs/guides/functions
- Funções públicas precisam de `verify_jwt = false` / `auth: 'none'` com **cuidado**: a handler fica responsável por autenticar o caller; não usar em endpoint sensível sem verificar o caller de outra forma. — https://supabase.com/docs/guides/functions/auth
- Padrão alinhado à docs (sem inventar “emitir JWT custom de senha”): o browser chama uma Edge Function com a senha → a function (com secret/`service_role` **só no servidor**) confere o segredo no banco → responde OK e/ou devolve dados / **signed URLs** de Storage. Assinar URL no servidor é explicitamente citado. — https://supabase.com/docs/guides/storage/serving/downloads e https://supabase.com/docs/guides/functions/auth
- **Não encontrado** na docs oficial consultada: API first-party do tipo “RPC/Edge recebe senha compartilhada e devolve JWT de Auth arbitrário sem usuário”. Para sessão JWT duradoura, o caminho documentado continua sendo **Auth** (password, anonymous, etc.).

#### 6) RPC (Database Function) — **útil para checagens, com ressalvas**

- Funções Postgres são chamáveis via `supabase.rpc(...)`. Podem receber parâmetros e retornar dados. — https://supabase.com/docs/guides/database/functions
- `SECURITY DEFINER` executa como o dono da função; a docs recomenda preferir `SECURITY INVOKER`, e se usar DEFINER **obrigatório** `set search_path`. RLS **não** se aplica a functions da mesma forma; controlar `EXECUTE` e revisar DEFINER. — https://supabase.com/docs/guides/database/functions e https://supabase.com/docs/guides/api/securing-your-api
- Uma RPC DEFINER que só retorna `true/false` após comparar hash **pode** ser um portão de senha na Data API; uma RPC que devolve linhas sensíveis a quem adivinhar/força a senha precisa de rate limit e desenho cuidadoso (pre-request / Edge / Auth). **Não há** na docs um template oficial “wedding_password_login”.

### RLS / policies no cenário sem usuário por convidado

- Roles relevantes: `anon` (não logado), `authenticated` (logado, inclusive anônimo Auth), `service_role` (bypass). Preferir `TO anon` / `TO authenticated` nas policies. — https://supabase.com/docs/guides/database/postgres/row-level-security
- Sem Auth por convidado, policies tipicamente caem em `anon` — e aí o segredo compartilhado **precisa** de outro mecanismo (pre-request, RPC DEFINER, Edge Function), senão a chave pública do Vite basta para acessar. — síntese das fontes acima
- Storage: policies em `storage.objects`; exemplos oficiais amarram a `authenticated` e `bucket_id`; é possível policy ampla (`with check (true)`), mas isso é o extremo permissivo. — https://supabase.com/docs/guides/storage/security/access-control
- Upload exige SELECT coerente com INSERT (RETURNING). — https://supabase.com/docs/guides/troubleshooting/storage-error-403-forbidden-new-row-violates-row-level-security-policy-on-upload-a94384

### Caminho “recomendado” pela leitura das docs (síntese para PM / grilling)

Ordem sugerida pela **segurança do modelo oficial** (não é ADR fechado):

1. **Vite** só com publishable/`anon` + URL.
2. Tabelas `casamentos` + `fotos` (proposta) com **RLS ligado**; senha **nunca** legível via SELECT público.
3. Bucket Storage com MIME JPG/PNG + limite de tamanho; decidir público vs privado no grilling.
4. **Não** confiar em “senha só no frontend”.
5. Escolher um dos padrões documentados para a senha:
   - **A — Edge Function (ou RPC DEFINER) verifica senha no servidor**, depois libera dados/upload (e signed URLs se bucket privado); e/ou
   - **B — Pre-request + header de chave de app** para Data API (e espelhar em RLS de Storage); e/ou
   - **C — Auth password** com uma conta compartilhada (API oficial de senha, mas é login Auth).
6. `service_role`/secret **somente** dentro da Edge Function (ou backend), nunca no React.

## Open questions

- Produto aceita bucket **público** (URL da foto compartilhável por quem a tiver) ou exige **privado** + signed URLs / sessão?
- A “senha do casamento” será modelada como (A) gate Edge/RPC, (B) API key de app no header, (C) Auth email+senha compartilhado, ou híbrido? (Decisão de ADR, fora desta pesquisa.)
- Noivos criam o casamento pelo mesmo app Vite: quem chama a criação (só service role / Edge Function admin, ou `anon` com policy estreita na v1 de um registro)?
- Limite de tamanho por foto e se `image/*` vs só `image/jpeg` + `image/png`.
- Listagem do álbum via tabela `fotos` vs `storage.list` — preferência de produto/ops.
- Rate limit / CAPTCHA no portão da senha e nos uploads (docs de anonymous e going-to-prod citam abuso; detalhar no grilling).
- Hash da senha: extensão/algoritmo no Postgres (ex. pgcrypto) ou verificação só em TypeScript na Edge Function — **não fixado** nesta nota; verificar extensões oficiais no grilling de schema.
