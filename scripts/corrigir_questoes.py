"""
Corrige os problemas de importação nas questões RP no conteudo.json:
1. Extrai alternativas embutidas no enunciado (padrão (A)...(E))
2. Remove fragmentos de tabelas laboratoriais
3. Remove questões dissertativas misturadas nas de múltipla escolha
4. Corrige rp_2018_004 com 10 alternativas (2 questões fundidas)
5. Remove questões parcialmente extraídas (corrompidas)
"""

import sys
import io
import json
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

CONTEUDO_PATH = 'src/data/conteudo.json'

# IDs para DELETAR (não servem como MCQ)
DELETAR = {
    # Fragmentos de tabelas laboratoriais
    'rp_2020_012', 'rp_2020_024',
    'rp_2022_006', 'rp_2022_008', 'rp_2022_025', 'rp_2022_027',
    'rp_2023_006', 'rp_2023_008', 'rp_2023_021', 'rp_2023_022', 'rp_2023_025',
    # Questões dissertativas (Fase 2) misturadas nas de Fase 1
    'rp_2020_002', 'rp_2020_003',
    'rp_2021_001', 'rp_2021_003',
    'rp_2022_001', 'rp_2022_002', 'rp_2022_003',
    'rp_2023_001', 'rp_2023_002', 'rp_2023_003',
    # Parcialmente extraídas (sem início, corrompidas)
    'rp_2023_005', 'rp_2023_013', 'rp_2023_015',
    # Tabela com enunciado longo
    'rp_2022_023',
}


def parse_embedded_alts(enunciado: str):
    """
    Extrai alternativas (A)-(E) embutidas no enunciado.
    Retorna (enunciado_limpo, lista_de_alternativas) ou (None, None) se não encontrar.
    """
    pattern = r'\s*\(A\)\s*(.*?)\s*\(B\)\s*(.*?)\s*\(C\)\s*(.*?)\s*\(D\)\s*(.*?)\s*\(E\)\s*(.*)'
    m = re.search(pattern, enunciado, re.DOTALL)
    if not m:
        return None, None

    a, b, c, d, e_raw = m.groups()

    # Truncar (E): parar em número+letra (nova questão), ou em \n\n, ou em 600 chars
    e_clean = e_raw.strip()
    # Remove conteúdo de nova questão que veio junto (ex: "30 Em relação...")
    e_clean = re.split(r'\n{2,}|\s{2,}\d{1,2}\s+[A-Z]', e_clean)[0].strip()
    # Limite máximo de 600 chars para a alternativa (E)
    if len(e_clean) > 600:
        # Tentar quebrar em ponto final
        match_period = re.search(r'[.!?]\s', e_clean[:601])
        if match_period:
            e_clean = e_clean[:match_period.end()].strip()
        else:
            e_clean = e_clean[:600].strip()

    clean_stem = enunciado[:m.start()].strip()
    alts = [
        'a) ' + a.strip(),
        'b) ' + b.strip(),
        'c) ' + c.strip(),
        'd) ' + d.strip(),
        'e) ' + e_clean,
    ]
    return clean_stem, alts


def main():
    with open(CONTEUDO_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    questoes = data['questoes']
    total_original = len(questoes)

    fixed_embedded = 0
    fixed_10alts = 0
    deleted = 0
    skipped = 0

    novas_questoes = []
    for q in questoes:
        qid = q.get('id', '')
        origem = q.get('origem', '')

        # Só mexe em questões RP
        if origem != 'rp':
            novas_questoes.append(q)
            continue

        # 1. Deletar IDs problemáticos
        if qid in DELETAR:
            deleted += 1
            print(f'[DELETE] {qid}')
            continue

        # 2. Corrigir rp_2018_004 com 10 alternativas
        if qid == 'rp_2018_004' and len(q['alternativas']) == 10:
            q['alternativas'] = q['alternativas'][:5]
            fixed_10alts += 1
            print(f'[FIX-10ALT] {qid}: cortado para 5 alternativas')
            novas_questoes.append(q)
            continue

        # 3. Extrair alternativas embutidas no enunciado
        if len(q['alternativas']) == 0 and '(A)' in q['enunciado']:
            stem, alts = parse_embedded_alts(q['enunciado'])
            if stem is not None:
                q['enunciado'] = stem
                q['alternativas'] = alts
                fixed_embedded += 1
                print(f'[FIX-EMBED] {qid}: alternativas extraídas')
            else:
                print(f'[SKIP] {qid}: não foi possível parsear alternativas embutidas')
                skipped += 1
            novas_questoes.append(q)
            continue

        # 4. Questões longas com (A)-(E) embutidas (mas que já podem ter alternativas)
        if len(q['alternativas']) == 5 and len(q['enunciado']) > 1500:
            # Limpar o enunciado truncando antes de qualquer (A) extra
            stem_before_A = q['enunciado'].split('(A)')[0].strip()
            if stem_before_A and len(stem_before_A) < len(q['enunciado']) * 0.8:
                print(f'[FIX-LONG] {qid}: enunciado truncado de {len(q["enunciado"])} para {len(stem_before_A)} chars')
                q['enunciado'] = stem_before_A
            novas_questoes.append(q)
            continue

        novas_questoes.append(q)

    data['questoes'] = novas_questoes

    with open(CONTEUDO_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print()
    print(f'=== RESUMO ===')
    print(f'Original:          {total_original} questões')
    print(f'Deletadas:         {deleted}')
    print(f'Fix embed (A-E):   {fixed_embedded}')
    print(f'Fix 10-alts:       {fixed_10alts}')
    print(f'Não parseadas:     {skipped}')
    print(f'Final:             {len(novas_questoes)} questões')


if __name__ == '__main__':
    main()
