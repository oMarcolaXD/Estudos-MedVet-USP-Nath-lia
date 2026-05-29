# Residência Vet USP — App de Estudos

App de estudos para o processo seletivo de Residência em Medicina Veterinária da USP (FUVEST). Roda 100% no navegador, sem backend.

## Pré-requisitos

- Node.js 18+
- npm 9+

## Instalação e uso

```bash
npm install
npm run dev
```

Abra http://localhost:5173 no navegador.

## Chave da API (geração por IA)

Para usar a geração de questões/flashcards/dissertativas por IA:

**Opção 1 — via interface:** acesse Configurações e cole sua chave `sk-ant-...` da Anthropic.

**Opção 2 — via `.env`:** crie um arquivo `.env` na raiz do projeto:
```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

> ⚠️ A chave é salva apenas no localStorage do seu navegador. Não publique o app com sua chave exposta.

## Funcionalidades

- **Dashboard** — visão geral, progresso por tema, histórico de simulados
- **Resumos** — resumos markdown por tema com bibliografia, anotações e atalhos para praticar
- **Flashcards** — repetição espaçada SM-2 (estilo Anki): Errei / Difícil / Bom / Fácil
- **Simulados** — formato P1 real (8 gerais + 7 interpretação + 25 específicas) ou por tema, com timer opcional, gabarito comentado
- **Dissertativa (P2)** — casos clínicos com pontos esperados para autoavaliação
- **Progresso** — gráficos de evolução e acertos por tema
- **Gerar com IA** — questões, flashcards e casos dissertativos gerados pelo Claude

## Estrutura de pastas

```
src/
  data/conteudo.json   ← banco de dados (seed + acumulado)
  pages/               ← telas do app
  components/          ← GerarIA modal
  types.ts             ← tipos TypeScript
  store.ts             ← localStorage + SM-2
  api.ts               ← integração com a API da Anthropic
  context.tsx          ← estado global React
  App.tsx              ← layout e rotas
  main.tsx             ← entry point
```

## Build para produção

```bash
npm run build
```

Os arquivos ficam em `dist/` e podem ser servidos por qualquer servidor estático (ex.: `npx serve dist`).
