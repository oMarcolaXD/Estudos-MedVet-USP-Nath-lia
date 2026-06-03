"""
Normaliza texto das questões RP no conteudo.json:
1. Substitui \xa0 (non-breaking space do PDF) por espaço normal
2. Colapsa múltiplos espaços
3. Insere \n antes de algarismos romanos em lista (I. II. III. ...)
"""

import sys
import io
import json
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

CONTEUDO_PATH = 'src/data/conteudo.json'

# Algarismos romanos de I a XXX (ordem decrescente para evitar match parcial)
ROMANOS = [
    'XXX', 'XXIX', 'XXVIII', 'XXVII', 'XXVI', 'XXV', 'XXIV', 'XXIII',
    'XXII', 'XXI', 'XX', 'XIX', 'XVIII', 'XVII', 'XVI', 'XV', 'XIV',
    'XIII', 'XII', 'XI', 'X', 'IX', 'VIII', 'VII', 'VI', 'V', 'IV',
    'III', 'II', 'I',
]
ROMANO_PATTERN = '|'.join(ROMANOS)


def normalizar(texto: str) -> str:
    # 1. \xa0 → espaço normal
    texto = texto.replace('\xa0', ' ')
    # 2. Colapsar múltiplos espaços (mas preservar \n)
    texto = re.sub(r'[ \t]{2,}', ' ', texto)
    # 3. Inserir \n antes de algarismos romanos em lista
    #    Condição: o texto deve conter pelo menos dois itens (I. e II.)
    #    Pattern: espaço + ROMANO + ". " + letra maiúscula ou dígito
    if re.search(r'\bI\. ', texto) and re.search(r'\bII\. ', texto):
        texto = re.sub(
            r' (' + ROMANO_PATTERN + r')\. ',
            lambda m: '\n' + m.group(1) + '. ',
            texto
        )
        # Garantir que o primeiro item também fique em nova linha
        # (se vier logo após : ou após texto de continuação)
        texto = re.sub(r':\s*\nI\.', ':\nI.', texto)
    texto = texto.strip()
    return texto


def main():
    with open(CONTEUDO_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    total_fixed = 0

    for q in data['questoes']:
        changed = False
        orig_enunc = q['enunciado']
        novo_enunc = normalizar(orig_enunc)
        if novo_enunc != orig_enunc:
            q['enunciado'] = novo_enunc
            changed = True

        novas_alts = []
        for alt in q['alternativas']:
            nova_alt = normalizar(alt)
            novas_alts.append(nova_alt)
            if nova_alt != alt:
                changed = True
        q['alternativas'] = novas_alts

        if changed:
            total_fixed += 1

    with open(CONTEUDO_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f'Questões normalizadas: {total_fixed}')


if __name__ == '__main__':
    main()
