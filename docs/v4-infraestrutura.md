# Tchat Love Club v4 — infraestrutura de desenvolvimento

Escopo: develop-v4 / Vercel Preview. Não publicar em main. Não reutilizar credenciais ou dados reais de produção.

## Decisão
Manter Upstash Redis de produção exclusivamente para a quota Gemini existente. Usar PostgreSQL + autenticação gerenciada (preferência Supabase) em projeto de teste dedicado para administração, métricas agregadas e inscrições push. Criar Redis de teste independente se necessário para testar a quota. Nenhum recurso pago deve ser ativado sem aprovação.

## Modelo de dados proposto
- Administradores: identidade autenticada, papel administrativo atribuído no servidor, MFA, revogação de acesso.
- Métricas diárias: dia UTC, idioma, tipo de evento permitido, contagem agregada. Sem conteúdo de mensagens, diários, senhas, IP bruto ou identificadores de terceiros.
- Inscrições push: endpoint e chaves de inscrição, idioma, consentimento, data de atualização e revogação. Acesso exclusivo por funções autorizadas; retenção e exclusão definidas antes de ativar coleta.
- Auditoria: ação administrativa, resultado, horário, identidade do administrador; nunca registrar segredos.
- Usuários cadastrados e retenção individual: indisponíveis até autenticação centralizada e definição de consentimento/base legal. Não confundir dispositivos com pessoas.

## Fronteiras
Funções Vercel verificam autenticação e autorização em toda operação administrativa. MFA para administradores; nenhum cadastro público de administrador. RLS e privilégios mínimos no banco; credenciais privilegiadas exclusivamente no servidor. Eventos com lista permitida, limite de tamanho e taxa, sem conteúdo livre. Notificações opt-in, cancelamento e teste apenas em dispositivos autorizados. Logs sem payloads privados.
O endpoint Gemini atual, service worker e INDEX permanecem inalterados nesta etapa.

## Provisionamento pendente
Criar projeto de banco dedicado de teste em região adequada; confirmar plano e disponibilidade. Configurar segredos exclusivamente Preview/develop-v4 (nunca copiar os de produção). Configurar Redis e chave Gemini de teste independentes, se necessários. Não ativar coleta ou envio push antes de validar autorização, consentimento e isolamento.
Variáveis propostas: V4_ADMIN_ENABLED (default off), V4_DATABASE_URL ou configuração Supabase apropriada, credenciais de autenticação/servidor específicas do provedor. Não incluir valores no GitHub.

## Critérios de aceite
- Produção aponta para o deploy original.
- Preview sem credenciais novas falha de modo fechado.
- Usuário anônimo e usuário não administrador não acessam métricas ou envio push.
- Nenhum evento de teste alcança dados reais.
- Testar schema, RLS, revogação, limites, exportação/exclusão e logs antes de habilitar.
- Contagens exibidas como indisponíveis quando não houver dados; não usar números fictícios como reais.
- Revisão e autorização antes de merge/publicação.
