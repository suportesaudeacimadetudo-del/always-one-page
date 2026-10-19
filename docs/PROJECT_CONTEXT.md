# Contexto do Fisio Express

## Objetivo

Transformar o aplicativo existente em uma ferramenta profissional em português: encontrar exercícios, criar exercícios próprios e gerar orientações individualizadas em PDF. Preservar a identidade em azul-escuro e verde e o fluxo biblioteca → personalização → PDF.

A última decisão do proprietário é usar **somente português**. Não investir em versões em inglês ou espanhol sem nova solicitação.

## Planos definidos

Plus mensal: R$ 19,90. Plus anual: R$ 147, cobrados por 12 meses. Economia anual: R$ 91,80 (38,4%) em relação a 12 mensalidades. Valores e links ficam centralizados em `src/data/plans.ts`.

A interface apresenta o Plano Free e uma janela com os planos. O proprietário pediu o endereço `https://go.centerpag.com/PPU38CQH3TQ` nos dois planos; ambos estão cadastrados em `src/data/plans.ts`. Na conferência de 19/10/2026, o checkout mostrou um guia em espanhol por US$ 5,00, sem escolha visível de período. `checkoutVerified` permanece `false` e os botões pagos ficam indisponíveis até corrigir e verificar produto, moeda e períodos. O link antigo de US$ 9 do material em PDF também não serve como checkout destes planos.

Login, banco na nuvem, confirmação de pagamento e liberação automática ainda não foram implementados. IndexedDB é armazenamento local. Não marcar um visitante como assinante a partir de parâmetros da URL ou de um sinalizador local. A limitação do PDF gratuito à primeira página e uma segunda página de oferta foi discutida, mas ainda não foi aplicada: o fluxo de PDF existente permanece disponível enquanto a contratação está em preparação.

## Apresentação da biblioteca gratuita

A interface abre em Cervical e mostra apenas regiões do corpo, sem filtro Todos, contagens de catálogo, contagens nas regiões ou numeração nos cards. Cada região apresenta seus três primeiros exercícios como prévia fixa; a busca pesquisa essa prévia, sem liberar outros registros. No final da lista, uma chamada Assinar plano Plus abre a janela dos planos. O catálogo fonte completo é preservado e os exercícios próprios permanecem disponíveis na sua área.

Essa prévia é uma limitação de apresentação no aplicativo estático. Não é controle de autorização: o código e os dados completos continuam públicos. A proteção real do conteúdo e a liberação para assinantes dependem de login, backend e validação de pagamento. Não tratar o indicador Plano Free como autenticação. Os checkouts continuam pendentes de correção/verificação.

## Como funciona na tela inicial

Antes da prévia da ficha, a interface apresenta três passos: Encontre o exercício, Monte sua ficha e Baixe o PDF. Os cartões aparecem lado a lado no computador e empilhados no celular, com textos curtos e ícones. A prévia ilustrada aparece em seguida, também no celular, com a chamada Veja como sua ficha vai ficar. O fluxo de seleção, personalização e geração do PDF permanece o mesmo.

## Fonte do catálogo

`src/data/library.json` é a fonte única da biblioteca publicada. Contém os 100 exercícios trabalhados anteriormente neste projeto, adaptados para português, com instruções, equipamentos e orientações adicionais. Os identificadores `library-001` a `library-100` correspondem às ilustrações `public/exercises/001.jpg` a `100.jpg`.

As imagens são as ilustrações produzidas no projeto, comprimidas para 640 × 640 pixels. Não substituir uma imagem por uma pose genérica: a ficha deve usar a imagem do exercício selecionado. A correspondência editorial foi preservada; isso não constitui uma revisão clínica independente.

Os materiais anteriores estavam em `outputs/100-exercicios-ilustrados-ingles.pdf`, `outputs/100-exercicios-ilustrados-espanhol.pdf`, `work/exercises.tsv` e `outputs/100-imagens-exercicios/` no computador de origem. Não é necessário ter esses arquivos para executar este repositório: os textos e imagens usados pelo aplicativo estão versionados aqui.

Não acrescentar dosagens automáticas, promessas de resultado, qualificações pessoais ou endossos institucionais sem evidências. Os campos de prescrição começam vazios.

## Dados e limites atuais

- Biblioteca padrão: JSON estático versionado.
- Meus exercícios: IndexedDB `fisio-express`, object store `custom-exercises`, versão 1.
- Backup: JSON com `format: fisio-express-exercises`, `version: 1`, lista `exercises`. Inclui imagens incorporadas.
- Importação valida todos os registros antes de gravar; IDs existentes são preservados, sem sobrescrita. Para substituir uma versão editada em outro aparelho, exclua a versão antiga após fazer backup e importe novamente.
- Fotos: JPEG, PNG ou WebP de até 5 MB; redução local até 768 pixels, JPEG com qualidade 80%.
- Imagens recebidas por backup: apenas data URLs de imagem raster; sem SVG ou URLs externas.
- Identificação e ficha atual: memória da sessão, sem persistência ou envio a servidor.
- Sem conta, cobrança, autenticação, sincronização em nuvem ou IA remota. Busca é textual; não anunciar inteligência clínica automatizada.
- GitHub guarda o projeto, não o estado dos navegadores. Backup permite transportar exercícios; sincronização automática exige trabalho adicional com contas e banco de dados.

## Mapa técnico

- `src/routes/index.tsx`: interface e fluxo da ficha.
- `src/data/exercises.ts`: tipos, categorias e busca.
- `src/data/library.json`: 100 registros em português.
- `src/components/custom-exercise-dialog.tsx`: formulário acessível de cadastro e edição.
- `src/lib/custom-exercises.ts`: validação, importação, IndexedDB e preparação da imagem.
- `src/lib/exercise-pdf.ts`: PDF local com imagens reais e paginação sem truncar instruções.
- `preview/vite.config.ts`: distribuição estática com caminhos relativos e imagens públicas.

## Publicação e continuidade

Repositório: https://github.com/suportesaudeacimadetudo-del/always-one-page

A versão publicada anteriormente está em `gh-pages`. Desenvolva em uma branch de trabalho e revise antes de atualizar a publicação. Não faça force push nem altere o histórico publicado: o projeto tem integração Lovable.

Para continuar em outro computador, abra/clone este repositório e forneça este documento ao assistente. Faça backup dos exercícios no aplicativo antes de trocar de aparelho. O histórico desta conversa permanece separado do repositório.
