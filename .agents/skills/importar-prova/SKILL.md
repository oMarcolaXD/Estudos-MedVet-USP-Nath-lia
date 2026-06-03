---
name: importar-prova
description: Importa questões de provas reais de residência veterinária COREMU/USP (via FUVEST) a partir de PDF fornecido pelo usuário. Extrai 30 questões, cruza com gabarito Grupo 5 – Veterinária, classifica por temaId e insere no conteudo.json. Use quando o usuário mencionar "importar prova", "gabarito", "questões reais", "RP 20XX" ou "/importar-prova".
---

# Importar Prova COREMU/USP

Importa as 30 questões de uma prova real de residência veterinária (COREMU/USP via FUVEST) para o banco em `src/data/conteudo.json`.

## Início rápido

```
/importar-prova RP 2017
```

## Estrutura real da prova

| Questões | Seção | Conteúdo |
|---|---|---|
| 01–15 | Conhecimentos Gerais | SUS, redes, bioética, humanização — idênticas em todos os grupos |
| 16–30 | Veterinária | Questões específicas do Grupo 5 |

## Ano do ID vs ano da aplicação

O exame é identificado pelo **ano de início do programa** (ex: RP 2017), diferente do ano da aplicação (a prova do RP 2017 foi aplicada em 2016). Usar sempre o RP year.

## Fluxo

### 1. Confirmar ano
Se não vier nos argumentos, perguntar: "Qual o ano de início do programa? (ex: RP 2017)"

### 2. Receber os arquivos
O usuário pode:
- Anexar o PDF diretamente na conversa (preferível)
- Colar o texto copiado do PDF (Ctrl+A → Ctrl+C)

Aceitar ambas as formas. Solicitar gabarito e prova se ainda não foram enviados.

### 3. Extrair gabarito do Grupo 5
No PDF do gabarito:
- Localizar a coluna **"Grupo 5: Veterinária"** (sempre na 1ª página, 5ª coluna da tabela)
- Extrair as 30 respostas (01 a 30)
- Questões marcadas como **"ANULADA"** → registrar e pular

### 4. Extrair questões da prova
- Seção "CONHECIMENTOS GERAIS": questões 01–15
- Seção "VETERINÁRIA": questões 16–30
- Copiar enunciado completo + 5 alternativas (a–e) de cada questão

### 5. Formatar JSON
Para cada questão (exceto ANULADAS):
- Cruzar com resposta do Grupo 5 (letra → índice 0–4, ver REFERENCE.md)
- Classificar em `temaId` conforme tabela em REFERENCE.md
- ID: `rp_<ano>_<NNN>` (ex: `rp_2017_001`)
- Origem: `"rp-<ano>"` (ex: `"rp-2017"`)

### 6. Mostrar prévia
Exibir as primeiras 3 questões formatadas e perguntar:
> "Parece correto? Posso inserir todas as [N] questões no banco?"

### 7. Salvar em arquivo temporário e inserir
```
node .agents/skills/importar-prova/scripts/append.js <arquivo-temp.json>
npm run build
```

### 8. Commit
```
git add src/data/conteudo.json
git commit -m "banco: importa prova RP <ano> (<N> questoes reais)"
```

## Regras de qualidade

- **Nunca sobrescrever** — o script rejeita IDs duplicados automaticamente
- Questões ANULADAS: pular completamente
- Dificuldade padrão: `"media"` (sem pista clara no enunciado)
- Elaborar `explicacao` com base no conteúdo (o gabarito não traz justificativa)
- Relatório final: N inseridas · N anuladas puladas · N erros

## Referência

Ver [REFERENCE.md](REFERENCE.md) para formato JSON, conversão letra→índice e mapa de temaId.
