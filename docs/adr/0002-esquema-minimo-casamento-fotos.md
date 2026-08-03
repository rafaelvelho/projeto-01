# Esquema mínimo: casamento, fotos, links privado/público

Para a primeira fatia guardamos metadados em duas tabelas Postgres e os bytes das imagens em um bucket **privado** no Storage. Segredos (senha do casamento e código dos noivos) ficam só como hash, conferidos no portão do servidor (ADR-0001). O casamento tem **slug do link privado** e **slug do link público**; `publicado` liga/desliga o público; `congelado_em` marca a primeira publicação e nunca reabre envio de convidados. Despublicar só desliga o público. Fora de propósito nesta fatia: nome de quem enviou, várias tabelas de usuários, curtidas/comentários, multi-casamento.

## Campos (mínimo)

**casamentos:** `id`, `nome`, `data`, `descricao_romantica`, `senha_hash`, `codigo_noivos_hash`, `slug_privado`, `slug_publico`, `publicado` (bool), `congelado_em` (timestamptz nullable), `created_at`

**fotos:** `id`, `casamento_id`, `storage_path`, `created_at`

**Storage:** bucket privado (JPG/PNG); URLs de leitura via portão/signed URLs conforme o link (privado autenticado por senha; público só se `publicado`).
