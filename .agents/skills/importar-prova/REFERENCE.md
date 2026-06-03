# Referência — importar-prova

## Formato JSON exato

### Questão (inserir em `conteudo.questoes`)

```json
{
  "id": "rp_2017_016",
  "temaId": "anestesiologia",
  "categoria": "especifico",
  "enunciado": "Texto completo do enunciado da questão...",
  "alternativas": ["a) ...", "b) ...", "c) ...", "d) ...", "e) ..."],
  "correta": 1,
  "explicacao": "Explicação elaborada do porquê a alternativa B é correta...",
  "dificuldade": "media",
  "origem": "rp-2017"
}
```

**Todos os campos são obrigatórios.**

## Padrão de ID e origem

| Campo | Formato | Exemplo |
|---|---|---|
| `id` | `rp_<ano>_<NNN>` | `rp_2017_016` |
| `origem` | `rp-<ano>` | `rp-2017` |

`<ano>` = ano de início do programa (RP year), não o ano da aplicação.  
`<NNN>` = número original da questão com zero à esquerda (001–030).

## Converter letra do gabarito → índice `correta`

| Letra | Índice |
|---|---|
| A | 0 |
| B | 1 |
| C | 2 |
| D | 3 |
| E | 4 |
| ANULADA | — (pular questão) |

## Localizar Grupo 5 no gabarito

O gabarito COREMU/USP tem múltiplos grupos em colunas.  
**Grupo 5 – Veterinária** está sempre na **5ª coluna da 1ª página**.  
Questões 01–15 têm resposta idêntica em todos os grupos; usar a coluna do Grupo 5 para consistência.

## Mapa de temaId — Questões 01–15 (Conhecimentos Gerais)

| Assunto / palavras-chave | temaId | categoria |
|---|---|---|
| SUS, princípios, universalidade, integralidade, equidade, equipe de referência | `sus` | `geral` |
| Atenção Básica, PNAB, ESF, Consultório na Rua, UBS, ACS, capilaridade | `pnab` | `geral` |
| Redes de Atenção à Saúde, RAS, Regiões de Saúde, fragmentação, pontos de atenção | `redes` | `geral` |
| Trabalho em equipe, vínculo, responsabilização, interprofissionalidade | `interprofissionalidade` | `geral` |
| PNH, humanização, Clínica Ampliada, diretrizes de humanização | `pnh` | `geral` |
| Bioética, autonomia, paternalismo, informação ao usuário, dignidade, consentimento | `bioetica` | `geral` |
| Texto-base + pergunta de interpretação/inferência | `interpretacao` | `interpretacao` |

## Mapa de temaId — Questões 16–30 (Veterinária)

| Assunto / palavras-chave | temaId | categoria |
|---|---|---|
| Planos anestésicos, anestesia geral, fármacos anestésicos, sedação | `anestesiologia` | `especifico` |
| Exame físico, propedêutica, percussão, linfonodos, palpação retal | `semiologia` | `especifico` |
| Pneumonias em equinos, doenças respiratórias, Rhodococcus equi | `grandes-animais` | `especifico` |
| Mastite, bovinos, glândula mamária, CMT, rebanho leiteiro | `grandes-animais` | `especifico` |
| Sistema nervoso, neurologia, localização de lesão, propriocepção | `semiologia` | `especifico` |
| Mormo, Burkholderia mallei, doenças de equinos | `zoonoses` | `especifico` |
| Lesão celular, adaptação, necrose, degeneração, atrofia, metaplasia | `patologia` | `especifico` |
| Cicatrização, tecido de granulação, colágeno, hemostasia | `patologia` | `especifico` |
| Inflamação aguda, inflamação crônica, neutrófilos, macrófagos | `patologia` | `especifico` |
| Neoplasias, tumores benignos/malignos, metástase, anaplasia | `patologia` | `especifico` |
| Raiva, vírus rábico, morcego, variante antigênica | `zoonoses` | `especifico` |
| Hemograma, eritrograma, anemia, reticulócitos, VCM, HCM | `patologia-clinica` | `especifico` |
| Proteinúria, exame de urina, glomerulopatia, RPC | `patologia-clinica` | `especifico` |
| Cardiopatias, cardiomiopatia, doença valvar, insuficiência cardíaca | `caes-gatos` | `especifico` |
| Processos infecciosos cirúrgicos, antissepsia, desinfecção | `cirurgia` | `especifico` |

**Regra de desempate:** quando a questão cobre dois temas, escolher o mais específico/dominante no enunciado.

## Dificuldade padrão por seção

| Seção | distribuição |
|---|---|
| Conhecimentos Gerais (01–15) | 40% fácil · 40% média · 20% difícil |
| Veterinária (16–30) | 30% fácil · 45% média · 25% difícil |

Sem pista clara → `"media"`.

## Estrutura do conteudo.json (referência para append seguro)

```json
{
  "temas": [...],
  "questoes": [...],   ← append aqui (script rejeita IDs duplicados)
  "flashcards": [...],
  "dissertativas": [...]
}
```
