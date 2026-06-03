"""
Corrige inconsistências de categoria/temaId nas questões RP:
1. Alinha categoria com a categoria do tema (35 questões)
2. Corrige temaId errado para rp_2019_017 (redes de atenção, não caes-gatos)
"""

import sys
import io
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

CONTEUDO_PATH = 'src/data/conteudo.json'

# Correções manuais de temaId (cases óbvios onde o temaId em si está errado)
CORRECOES_TEMAID = {
    'rp_2019_017': 'redes',  # "redes de atenção à saúde no SUS, Decreto 7508"
}

def main():
    with open(CONTEUDO_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    temas = {t['id']: t for t in data['temas']}
    fixed_tema = 0
    fixed_cat = 0

    for q in data['questoes']:
        if q.get('origem') != 'rp':
            continue

        qid = q['id']

        # 1. Corrigir temaId errado
        if qid in CORRECOES_TEMAID:
            novo_tema = CORRECOES_TEMAID[qid]
            print(f'[FIX-TEMA] {qid}: {q["temaId"]} → {novo_tema}')
            q['temaId'] = novo_tema
            fixed_tema += 1

        # 2. Alinhar categoria com a categoria do tema
        tema_obj = temas.get(q['temaId'])
        if tema_obj and q['categoria'] != tema_obj['categoria']:
            print(f'[FIX-CAT]  {qid}: categoria={q["categoria"]} → {tema_obj["categoria"]} (tema={q["temaId"]})')
            q['categoria'] = tema_obj['categoria']
            fixed_cat += 1

    with open(CONTEUDO_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print()
    print(f'temaId corrigidos:  {fixed_tema}')
    print(f'categoria alinhada: {fixed_cat}')
    print(f'total alterado:     {fixed_tema + fixed_cat}')

if __name__ == '__main__':
    main()
