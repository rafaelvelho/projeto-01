# Senha do casamento via portão no servidor + código dos noivos

Precisávamos de uma “senha de casamento” compartilhada (sem conta por pessoa) e de um segundo nível para os noivos. Validar a senha só no React seria inseguro (a chave do frontend é pública). Decidimos: portão no servidor (Edge Function / equivalente Supabase) confere a **senha do casamento** antes de liberar álbum/upload; um **código dos noivos** separado libera o Modo noivos (trocar senha, apagar fotos). Sessão vale só enquanto a aba estiver aberta; senha errada só mostra mensagem e permite nova tentativa.

## Considered options

- Checagem só no frontend — rejeitado (inseguro)
- Conta Auth compartilhada (e-mail + senha) — rejeitado (UX de “conta”, não de casamento)
- Pre-request / API key no header — adiado (menos didático nesta fatia)
