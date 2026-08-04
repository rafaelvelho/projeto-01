import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BUCKET = "fotos-album";
const SESSION_HOURS = 12;

type Papel = "convidado" | "noivos";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-album-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing Supabase service env");
  return createClient(url, key);
}

async function requireOwner(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!jwt || !anon || jwt === anon) return null;
  const url = Deno.env.get("SUPABASE_URL");
  if (!url) return null;
  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

async function hashSecret(secret: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function slugify(nome: string) {
  const base = nome
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "casamento";
}

function randomSuffix() {
  return crypto.randomUUID().slice(0, 8);
}

function publicMeta(row: {
  id: string;
  nome: string;
  data: string;
  descricao_romantica: string;
  slug_privado: string;
  slug_publico: string;
  publicado: boolean;
  congelado_em: string | null;
}) {
  return {
    id: row.id,
    nome: row.nome,
    data: row.data,
    descricaoRomantica: row.descricao_romantica,
    slugPrivado: row.slug_privado,
    slugPublico: row.slug_publico,
    publicado: row.publicado,
    congelado: Boolean(row.congelado_em),
    congeladoEm: row.congelado_em,
  };
}

async function createSession(
  supabase: ReturnType<typeof adminClient>,
  casamentoId: string,
  papel: Papel,
) {
  const expires = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  const { data, error } = await supabase
    .from("sessoes")
    .insert({
      casamento_id: casamentoId,
      papel,
      expires_at: expires.toISOString(),
    })
    .select("token, papel")
    .single();
  if (error || !data) throw error ?? new Error("Falha ao criar sessão");
  return data as { token: string; papel: Papel };
}

async function requireSession(
  supabase: ReturnType<typeof adminClient>,
  token: string | null,
) {
  if (!token) return null;
  const { data, error } = await supabase
    .from("sessoes")
    .select("token, casamento_id, papel, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (error || !data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) {
    await supabase.from("sessoes").delete().eq("token", token);
    return null;
  }
  return data as {
    token: string;
    casamento_id: string;
    papel: Papel;
    expires_at: string;
  };
}

async function signedUrls(
  supabase: ReturnType<typeof adminClient>,
  paths: string[],
) {
  if (paths.length === 0) return {} as Record<string, string>;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, 60 * 60);
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}

async function listFotos(
  supabase: ReturnType<typeof adminClient>,
  casamentoId: string,
) {
  const { data, error } = await supabase
    .from("fotos")
    .select("id, storage_path, created_at")
    .eq("casamento_id", casamentoId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const urls = await signedUrls(
    supabase,
    rows.map((r) => r.storage_path),
  );
  return rows.map((r) => ({
    id: r.id,
    url: urls[r.storage_path] ?? "",
    createdAt: r.created_at,
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const contentType = req.headers.get("content-type") ?? "";
    const tokenHeader = req.headers.get("x-album-token");
    let action = "";
    let payload: Record<string, unknown> = {};
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      action = String(form.get("action") ?? "");
      const raw = form.get("payload");
      if (typeof raw === "string" && raw) {
        payload = JSON.parse(raw) as Record<string, unknown>;
      }
      const f = form.get("file");
      if (f instanceof File) file = f;
    } else {
      const body = (await req.json()) as Record<string, unknown>;
      action = String(body.action ?? "");
      payload = body;
    }

    const supabase = adminClient();

    if (action === "create") {
      const owner = await requireOwner(req);
      if (!owner) {
        return json(
          { error: "Entre na sua conta de noivos para criar um casamento." },
          401,
        );
      }
      const { count: existentes, error: countErr } = await supabase
        .from("casamentos")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", owner.id);
      if (countErr) return json({ error: countErr.message }, 500);
      if ((existentes ?? 0) > 0) {
        return json(
          {
            error:
              "Esta conta já tem um álbum. Entre de novo para abrir o existente.",
          },
          409,
        );
      }
      const nome = String(payload.nome ?? "").trim();
      const data = String(payload.data ?? "").trim();
      const descricaoRomantica = String(payload.descricaoRomantica ?? "").trim();
      const senha = String(payload.senhaCasamento ?? "");
      const codigo = String(payload.codigoNoivos ?? "");
      if (!nome || !data || !senha || !codigo) {
        return json({ error: "Preencha nome, data, senha e código dos noivos." }, 400);
      }
      const base = slugify(nome);
      const slugPrivado = `${base}-privado-${randomSuffix()}`;
      const slugPublico = `${base}-publico-${randomSuffix()}`;
      const salt = crypto.randomUUID();
      const senhaHash = `${salt}:${await hashSecret(senha, salt)}`;
      const codigoHash = `${salt}:${await hashSecret(codigo, salt)}`;

      const { data: row, error } = await supabase
        .from("casamentos")
        .insert({
          nome,
          data,
          descricao_romantica: descricaoRomantica,
          senha_hash: senhaHash,
          codigo_noivos_hash: codigoHash,
          slug_privado: slugPrivado,
          slug_publico: slugPublico,
          owner_id: owner.id,
        })
        .select(
          "id, nome, data, descricao_romantica, slug_privado, slug_publico, publicado, congelado_em",
        )
        .single();
      if (error || !row) {
        return json({ error: error?.message ?? "Falha ao criar casamento" }, 500);
      }
      return json({ casamento: publicMeta(row) });
    }

    if (action === "list_mine") {
      const owner = await requireOwner(req);
      if (!owner) {
        return json({ error: "Entre na sua conta de noivos." }, 401);
      }
      const { data: rows, error } = await supabase
        .from("casamentos")
        .select(
          "id, nome, data, descricao_romantica, slug_privado, slug_publico, publicado, congelado_em, created_at",
        )
        .eq("owner_id", owner.id)
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({
        casamentos: (rows ?? []).map((row) => publicMeta(row)),
      });
    }

    if (action === "mine_painel") {
      const owner = await requireOwner(req);
      if (!owner) {
        return json({ error: "Entre na sua conta de noivos." }, 401);
      }
      const { data: row, error } = await supabase
        .from("casamentos")
        .select(
          "id, nome, data, descricao_romantica, slug_privado, slug_publico, publicado, congelado_em",
        )
        .eq("owner_id", owner.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!row) {
        return json({
          casamento: null,
          fotosCount: 0,
          bytesTotal: 0,
        });
      }

      const { data: fotos, error: fotosErr } = await supabase
        .from("fotos")
        .select("id, storage_path, bytes")
        .eq("casamento_id", row.id);
      if (fotosErr) return json({ error: fotosErr.message }, 500);
      const lista = fotos ?? [];

      // Preenche bytes faltantes a partir do Storage (fotos antigas).
      let bytesTotal = 0;
      for (const foto of lista) {
        if (typeof foto.bytes === "number" && foto.bytes >= 0) {
          bytesTotal += foto.bytes;
          continue;
        }
        const { data: meta } = await supabase.storage
          .from(BUCKET)
          .info(foto.storage_path);
        const size = Number(
          meta?.size ??
            (meta as { metadata?: { size?: number } } | null)?.metadata?.size ??
            0,
        );
        const safe = Number.isFinite(size) && size > 0 ? size : 0;
        if (safe > 0) {
          await supabase.from("fotos").update({ bytes: safe }).eq("id", foto.id);
        }
        bytesTotal += safe;
      }

      return json({
        casamento: publicMeta(row),
        fotosCount: lista.length,
        bytesTotal,
      });
    }

    if (action === "welcome") {
      const slug = String(payload.slugPrivado ?? "").trim();
      const { data: row, error } = await supabase
        .from("casamentos")
        .select(
          "id, nome, data, descricao_romantica, slug_privado, slug_publico, publicado, congelado_em",
        )
        .eq("slug_privado", slug)
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!row) return json({ error: "Casamento não encontrado." }, 404);
      return json({ casamento: publicMeta(row) });
    }

    if (action === "unlock") {
      const slug = String(payload.slugPrivado ?? "").trim();
      const senha = String(payload.senhaCasamento ?? "");
      const { data: row, error } = await supabase
        .from("casamentos")
        .select("*")
        .eq("slug_privado", slug)
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!row) return json({ error: "Casamento não encontrado." }, 404);
      const [salt, expected] = String(row.senha_hash).split(":");
      const got = await hashSecret(senha, salt);
      if (got !== expected) {
        return json({ error: "Senha incorreta. Tente de novo." }, 401);
      }
      const session = await createSession(supabase, row.id, "convidado");
      const fotos = await listFotos(supabase, row.id);
      return json({
        token: session.token,
        papel: session.papel,
        casamento: publicMeta(row),
        fotos,
      });
    }

    if (action === "unlock_noivos") {
      const session = await requireSession(supabase, tokenHeader);
      if (!session) return json({ error: "Sessão expirada. Entre de novo." }, 401);
      const codigo = String(payload.codigoNoivos ?? "");
      const { data: row, error } = await supabase
        .from("casamentos")
        .select("*")
        .eq("id", session.casamento_id)
        .single();
      if (error || !row) return json({ error: "Casamento não encontrado." }, 404);
      const [salt, expected] = String(row.codigo_noivos_hash).split(":");
      const got = await hashSecret(codigo, salt);
      if (got !== expected) {
        return json({ error: "Código dos noivos incorreto." }, 401);
      }
      await supabase.from("sessoes").delete().eq("token", session.token);
      const next = await createSession(supabase, row.id, "noivos");
      return json({ token: next.token, papel: next.papel });
    }

    if (action === "album") {
      const session = await requireSession(supabase, tokenHeader);
      if (!session) return json({ error: "Sessão expirada. Entre de novo." }, 401);
      const { data: row, error } = await supabase
        .from("casamentos")
        .select(
          "id, nome, data, descricao_romantica, slug_privado, slug_publico, publicado, congelado_em",
        )
        .eq("id", session.casamento_id)
        .single();
      if (error || !row) return json({ error: "Casamento não encontrado." }, 404);
      const fotos = await listFotos(supabase, row.id);
      return json({
        papel: session.papel,
        casamento: publicMeta(row),
        fotos,
      });
    }

    if (action === "public_album") {
      const slug = String(payload.slugPublico ?? "").trim();
      const { data: row, error } = await supabase
        .from("casamentos")
        .select(
          "id, nome, data, descricao_romantica, slug_privado, slug_publico, publicado, congelado_em",
        )
        .eq("slug_publico", slug)
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!row || !row.publicado) {
        return json({ error: "Álbum público indisponível." }, 404);
      }
      const fotos = await listFotos(supabase, row.id);
      return json({ casamento: publicMeta(row), fotos });
    }

    if (action === "upload") {
      const session = await requireSession(supabase, tokenHeader);
      if (!session) return json({ error: "Sessão expirada. Entre de novo." }, 401);
      if (!file) return json({ error: "Envie um arquivo JPG ou PNG." }, 400);
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        return json({ error: "Só JPG ou PNG." }, 400);
      }
      const { data: row, error } = await supabase
        .from("casamentos")
        .select("id, congelado_em")
        .eq("id", session.casamento_id)
        .single();
      if (error || !row) return json({ error: "Casamento não encontrado." }, 404);
      if (row.congelado_em && session.papel !== "noivos") {
        return json({ error: "Envio de convidados congelado." }, 403);
      }
      const ext = file.type === "image/png" ? "png" : "jpg";
      const path = `${row.id}/${crypto.randomUUID()}.${ext}`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const up = await supabase.storage.from(BUCKET).upload(path, bytes, {
        contentType: file.type,
        upsert: false,
      });
      if (up.error) return json({ error: up.error.message }, 500);
      const { data: foto, error: fotoErr } = await supabase
        .from("fotos")
        .insert({
          casamento_id: row.id,
          storage_path: path,
          bytes: file.size,
        })
        .select("id, storage_path, created_at")
        .single();
      if (fotoErr || !foto) {
        return json({ error: fotoErr?.message ?? "Falha ao registrar foto" }, 500);
      }
      const urls = await signedUrls(supabase, [path]);
      return json({
        foto: {
          id: foto.id,
          url: urls[path] ?? "",
          createdAt: foto.created_at,
        },
      });
    }

    if (action === "share_foto") {
      const fotoId = String(payload.fotoId ?? "");
      if (!fotoId) return json({ error: "Foto não informada." }, 400);
      const { data: foto, error } = await supabase
        .from("fotos")
        .select("id, storage_path, casamento_id")
        .eq("id", fotoId)
        .maybeSingle();
      if (error || !foto) return json({ error: "Foto não encontrada." }, 404);

      const session = await requireSession(supabase, tokenHeader);
      if (session && session.casamento_id === foto.casamento_id) {
        // ok — sessão do álbum privado
      } else {
        const { data: casamento, error: cErr } = await supabase
          .from("casamentos")
          .select("id, publicado")
          .eq("id", foto.casamento_id)
          .maybeSingle();
        if (cErr || !casamento?.publicado) {
          return json({ error: "Sem permissão para compartilhar esta foto." }, 403);
        }
      }

      const down = await supabase.storage.from(BUCKET).download(foto.storage_path);
      if (down.error || !down.data) {
        return json({ error: down.error?.message ?? "Falha ao ler a foto" }, 500);
      }
      const contentType = down.data.type || "image/jpeg";
      return new Response(down.data, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          "Cache-Control": "private, max-age=60",
        },
      });
    }

    if (action === "delete_foto") {
      const session = await requireSession(supabase, tokenHeader);
      if (!session || session.papel !== "noivos") {
        return json({ error: "Só noivos podem apagar fotos." }, 403);
      }
      const fotoId = String(payload.fotoId ?? "");
      const { data: foto, error } = await supabase
        .from("fotos")
        .select("id, storage_path, casamento_id")
        .eq("id", fotoId)
        .maybeSingle();
      if (error || !foto || foto.casamento_id !== session.casamento_id) {
        return json({ error: "Foto não encontrada." }, 404);
      }
      await supabase.storage.from(BUCKET).remove([foto.storage_path]);
      await supabase.from("fotos").delete().eq("id", foto.id);
      return json({ ok: true });
    }

    if (action === "change_senha") {
      const session = await requireSession(supabase, tokenHeader);
      if (!session || session.papel !== "noivos") {
        return json({ error: "Só noivos podem trocar a senha." }, 403);
      }
      const nova = String(payload.novaSenha ?? "");
      if (!nova) return json({ error: "Informe a nova senha." }, 400);
      const salt = crypto.randomUUID();
      const senhaHash = `${salt}:${await hashSecret(nova, salt)}`;
      const { error } = await supabase
        .from("casamentos")
        .update({ senha_hash: senhaHash })
        .eq("id", session.casamento_id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "publish") {
      const session = await requireSession(supabase, tokenHeader);
      if (!session || session.papel !== "noivos") {
        return json({ error: "Só noivos podem publicar." }, 403);
      }
      const { data: row, error: getErr } = await supabase
        .from("casamentos")
        .select(
          "id, nome, data, descricao_romantica, slug_privado, slug_publico, publicado, congelado_em",
        )
        .eq("id", session.casamento_id)
        .single();
      if (getErr || !row) return json({ error: "Casamento não encontrado." }, 404);
      const patch: Record<string, unknown> = { publicado: true };
      if (!row.congelado_em) patch.congelado_em = new Date().toISOString();
      const { data: updated, error } = await supabase
        .from("casamentos")
        .update(patch)
        .eq("id", row.id)
        .select(
          "id, nome, data, descricao_romantica, slug_privado, slug_publico, publicado, congelado_em",
        )
        .single();
      if (error || !updated) return json({ error: error?.message ?? "Falha" }, 500);
      return json({ casamento: publicMeta(updated) });
    }

    if (action === "unpublish") {
      const session = await requireSession(supabase, tokenHeader);
      if (!session || session.papel !== "noivos") {
        return json({ error: "Só noivos podem despublicar." }, 403);
      }
      const { data: updated, error } = await supabase
        .from("casamentos")
        .update({ publicado: false })
        .eq("id", session.casamento_id)
        .select(
          "id, nome, data, descricao_romantica, slug_privado, slug_publico, publicado, congelado_em",
        )
        .single();
      if (error || !updated) return json({ error: error?.message ?? "Falha" }, 500);
      return json({ casamento: publicMeta(updated) });
    }

    return json({ error: `Ação desconhecida: ${action}` }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return json({ error: message }, 500);
  }
});
