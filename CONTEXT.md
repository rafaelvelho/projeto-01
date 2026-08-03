# Álbum coletivo de casamento

Contexto do produto: um álbum de fotos coletivo para **um** casamento, onde convidados enviam fotos e todos com acesso veem o álbum junto; depois os noivos podem publicar uma versão só de visualização.

## Language

**Casamento**:
O evento único para o qual este álbum existe (nesta primeira versão, só existe um).
_Avoid_: Evento, wedding (no glossário em português), projeto

**Noivos**:
Quem cria o casamento (nome, data, senha do casamento, código dos noivos, descrição) e compartilha o link de acesso.
_Avoid_: Dono, organizador, casal (quando se refere ao papel no sistema), admin (como nome de pessoa)

**Convidado**:
Quem entra com a senha do casamento no link privado e, enquanto não estiver congelado, pode enviar fotos e ver o álbum — sem o código dos noivos.
_Avoid_: Usuário, user, guest (no glossário em português)

**Link privado**:
Endereço com senha do casamento: enviar/ver (antes do congelamento) e Modo noivos.
_Avoid_: Link admin, URL secreta (como termo canônico)

**Link público**:
Endereço só de visualização, sem senha, ativo somente enquanto o álbum estiver publicado.
_Avoid_: Galeria aberta, share link (como termo canônico)

**Publicar**:
Ação do Modo noivos que ativa o link público. Na primeira vez, também congela o envio pelos convidados.
_Avoid_: Postar no Instagram (sentido do produto), deploy

**Despublicar**:
Ação do Modo noivos que desativa o link público. Não reabre o envio pelos convidados.
_Avoid_: Deletar álbum, arquivar

**Congelado**:
Estado após a primeira publicação: convidados não enviam mais pelo link privado; Modo noivos ainda pode adicionar/apagar fotos e publicar/despublicar.
_Avoid_: Bloqueado, fechado, archived (como termo canônico)

**Link de acesso**:
Termo genérico; preferir **Link privado** ou **Link público** quando o tipo importar.
_Avoid_: URL mágica, invite link (como termo canônico)

**Tela de boas-vindas**:
Primeira tela do link privado: título de boas-vindas ao casamento e campo da senha do casamento.
_Avoid_: Login page (quando se refere a esta tela), splash

**Senha do casamento**:
Segredo compartilhado que libera o link privado. Não é conta com e-mail.
_Avoid_: Autenticação de usuário, conta Google, login social

**Código dos noivos**:
Segundo segredo, definido na criação; abre o Modo noivos.
_Avoid_: Master password, PIN admin (como termo canônico), senha do casamento

**Modo noivos**:
Área no link privado (botão no canto superior direito) com o código dos noivos: trocar senha, apagar/adicionar fotos, publicar e despublicar.
_Avoid_: Admin panel (como termo canônico), backoffice, dashboard

**Álbum**:
O conjunto de fotos daquele casamento (as mesmas fotos alimentam o link privado e, se publicado, o link público).
_Avoid_: Galeria, feed, drive

**Foto**:
Uma imagem JPG ou PNG no Storage, sem edição no app; metadados na tabela de fotos.
_Avoid_: Mídia, attachment, arquivo (quando se refere à foto do álbum)

**Descrição romântica**:
Texto curto sugerido pelo sistema e editável pelos noivos, exibido na página do casamento.
_Avoid_: Bio, about, mensagem do sistema
