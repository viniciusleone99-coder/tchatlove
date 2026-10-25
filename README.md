# Tchat Love Club — Gemini + quota diário

## Instalação

1. Envie o conteúdo desta pasta para a raiz do seu repositório GitHub.
2. Na Vercel, configure o projeto para publicar a raiz deste repositório (sem build).
3. Crie uma chave no Google AI Studio e configure `GEMINI_API_KEY` nas variáveis de ambiente da Vercel.
4. Crie um banco Redis compatível com a API REST Upstash e configure `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`. Configure também `QUOTA_SALT`.
5. Opcionalmente ajuste `GEMINI_MODEL` para um modelo disponível na sua conta (padrão `gemini-2.5-flash`).
6. Faça um novo deploy e abra `/decodeur-ia/`.

## Limitações importantes

- Limite real de **10 requisições por IP por dia UTC**, compartilhado por pessoas na mesma rede. Isso não é limite por usuário. Um usuário pode contornar o limite trocando IP. Para assinaturas pagas, implemente autenticação real e cobrança validada no servidor.
- Requisições que falham também consomem uma tentativa para evitar abuso.
- A chave Gemini e o token Redis devem ficar **somente** na Vercel, nunca no HTML nem no GitHub.
- Conversas são transmitidas à API Gemini; informe usuários e evite dados sensíveis.
- A página original mantém autenticação local, que não comprova pagamento.
- Os modelos e franquias gratuitas do Gemini podem mudar; confira no painel do Google.
- O projeto foi preparado e validado estaticamente; não foram testadas chamadas reais sem credenciais.
