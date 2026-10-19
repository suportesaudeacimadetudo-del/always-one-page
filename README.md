# Fisio Express

Biblioteca em português para organizar exercícios, personalizar orientações e gerar fichas em PDF no navegador.

## Funcionalidades

- 100 exercícios ilustrados, organizados por região e objetivo.
- Busca sem distinção de acentos, seleção e ordenação de exercícios.
- Cadastro, edição e exclusão de exercícios próprios, com imagem opcional.
- Exercícios próprios persistidos em IndexedDB neste navegador.
- Backup JSON com imagens e importação sem substituir registros existentes.
- Ficha com identificação opcional, séries, repetições, tempo, frequência e observações.
- PDF com a ilustração correspondente e paginação completa do texto.

Os dados do paciente e a ficha em andamento ficam somente na sessão. Os exercícios próprios ficam no navegador e não são sincronizados automaticamente entre aparelhos. Exporte o backup antes de trocar de dispositivo ou limpar o navegador. O backup não contém dados de pacientes.

## Desenvolvimento

Requer Node.js e Bun 1.3.1 (versão usada pelo projeto).

```sh
bun install --frozen-lockfile
bun run dev
```

## Publicação estática

```sh
bun run build:preview
```

Publique o **conteúdo** de `dist-preview/`, com `index.html` e as pastas `assets/` e `exercises/` na raiz. Os caminhos são relativos e funcionam em subpastas. A configuração inclui explicitamente `public/`, para publicar as 100 imagens.

Em Cloudflare Pages, use o comando `bun run build:preview` e a pasta de saída `dist-preview`. Em upload manual, envie o ZIP dessa pasta. O aplicativo atual não exige servidor, login ou chave de API. O domínio publicado deve usar HTTPS para disponibilizar todos os recursos do navegador.

O build TanStack original continua disponível com `bun run build`. Preserve a integração com Lovable e não reescreva histórico já publicado, conforme `AGENTS.md`.

## Continuidade do projeto

Leia [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md). O código e a documentação no GitHub permitem continuar o desenvolvimento em outro computador; isso não transfere automaticamente o histórico deste chat nem os exercícios salvos em cada navegador.

## Verificação

```sh
bun run check:library
bun run typecheck
bun run build:preview
```

Seleção e prescrição devem ser individualizadas pelo fisioterapeuta responsável. A organização do conteúdo não representa validação clínica independente ou endosso institucional.
