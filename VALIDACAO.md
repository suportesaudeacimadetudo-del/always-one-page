# Validação da versão Plus para aprovação

Preparada em pasta independente `/workspace/fisio-express-plus`. Nenhum projeto Pages foi criado ou publicado nesta rodada. Endereço sugerido, não reservado: `fisio-express-plus.pages.dev`.

## Resultado

- 10 testes de segurança do Worker passaram.
- 4 testes de navegador passaram, executando o Worker e KV locais com credenciais aleatórias de teste.
- TypeScript, ESLint dos módulos alterados, formatação e build passaram.
- Instalação pelo lockfile congelado validada; sem alterações no lockfile nessa verificação.
- 100 exercícios, dez regiões, IDs únicos e imagens idênticas ao catálogo original.
- 203 arquivos de fonte, dados, páginas públicas, documentação e configuração do projeto original comparados por SHA-256: zero alterações.

## Cobertura dos requisitos

| Item                      | Evidência                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1. Tela de login          | Capturas de 320 e 390 px e navegador real                                                            |
| 2. Bloqueio anônimo       | HTTP 401 para JS, catálogo e cem imagens; flags locais não liberam acesso                            |
| 3. Login válido           | Abre a ferramenta, com cookie Secure/HttpOnly/SameSite=Strict                                        |
| 4. Credenciais incorretas | Mensagem genérica, sem emitir sessão                                                                 |
| 5. Biblioteca completa    | Paginação até cem cards; sem corte de três por região                                                |
| 6. Imagens                | Cem respostas JPEG válidas autenticadas, com assinatura do arquivo                                   |
| 7. Busca e filtros        | Busca sem acentos e filtro por regiões exercitados                                                   |
| 8. Seleção                | Múltiplas regiões, ordem e remoção preservadas                                                       |
| 9. Personalização         | Identificação e parâmetros, ida/volta sem perda de campos                                            |
| 10. PDF                   | Download com assinatura PDF, texto real e uma página para três exercícios; renderização inspecionada |
| 11. Exercícios próprios   | Cadastro com imagem, edição, exclusão e inclusão na orientação                                       |
| 12. Persistência/backup   | Reload, IndexedDB exclusivo, exportação e importação sem dados de paciente                           |
| 13. Mobile                | Chromium 320/390 px e desktop 1440 px, sem overflow, CTA de seleção visível                          |
| 14. Logout                | Cookie expirado, registro revogado, sessão antiga recusada e outra sessão preservada                 |
| 15. Independência         | Baseline de 203 arquivos original intacta; builds, assets, variáveis e armazenamento separados       |

## Proteções

Sessão opaca aleatória de 256 bits, assinatura HMAC-SHA256 e registro em KV. Senha validada no servidor por comparação de hashes. Expiração absoluta em oito horas, logout e rotação de credenciais. Verificação de Origin nos POSTs, corpo de login limitado, no-store, CSP e bloqueio de frames. O Worker cobre todas as rotas, incluindo assets. Configuração ausente falha com 503, sem liberar a biblioteca. Senha real e chave não estão no código, ZIP ou bundle.

A conta é provisoriamente compartilhada. Não existem usuários individuais, recuperação de senha ou regras de vencimento de assinaturas. Não há sincronização de exercícios próprios: ficam no navegador, em IndexedDB exclusivo, com backup manual. KV é eventualmente consistente; a proteção básica contra tentativas não é atômica global e revogações podem levar tempo para se propagar entre regiões.

## Limites da verificação

Navegação em Chromium automatizado e Worker/KV local no Miniflare; não houve deploy ou teste no domínio de produção da Cloudflare. O Miniflare é uma dependência de desenvolvimento fixada no lockfile, não é enviado ao navegador nem utilizado pelo Worker de produção. Compartilhamento nativo foi simulado com arquivo PDF real; fallback baixou o arquivo. Não houve envio real por WhatsApp/e-mail, compra ou validação de assinaturas. A prévia incorporada do PDF depende do visualizador do navegador; Abrir PDF e Baixar PDF ficam disponíveis. Catálogo e instruções foram reutilizados, sem novos exercícios ou nova revisão clínica.

## Para publicar após aprovação

Preencher `FISIO_PLUS_PASSWORD` e `FISIO_PLUS_CLOUDFLARE_API_TOKEN` nos campos seguros exclusivos deste ambiente, conferir `FISIO_PLUS_ACCOUNT_ID`, revisar/salvar e publicar a configuração do **ambiente** para aplicar os valores. Isso não publica o site. A senha fornecida será gravada como Secret `PLUS_PASSWORD` no novo projeto; a chave `PLUS_SESSION_SECRET` será gerada com segurança. Criar namespace KV exclusivo e o projeto Pages separado, seguindo PUBLICACAO.md, depois testar no endereço real antes de entregar.
