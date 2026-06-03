#!/usr/bin/env python3
"""
Importador de provas COREMU/USP para conteudo.json
Uso: python scripts/importar_prova.py <ano>

Coloque os PDFs em:
  scripts/provas/rp-<ano>/prova.pdf
  scripts/provas/rp-<ano>/gabarito.pdf

Imagens extraídas vão para:
  public/questoes/rp-<ano>/q<NNN>.<ext>
"""
import fitz  # PyMuPDF
import json, re, sys
from pathlib import Path

PROJECT = Path(__file__).parent.parent
CONTEUDO = PROJECT / "src" / "data" / "conteudo.json"

# ─── classificador por palavras-chave ─────────────────────────────────────────
TEMAS = [
    ("pnab",               ["atenção básica", "pnab", "consultório na rua", "nasf",
                             "agente comunitário", "estratégia de saúde da família", "capilaridade"]),
    ("redes",              ["rede de atenção", "ras", "região de saúde", "portaria 4279",
                             "fragmentad", "ponto de atenção"]),
    ("sus",                ["sistema único de saúde", " sus ", "equipe de referência",
                             "universalidade", "integralidade"]),
    ("pnh",                ["humanização", "pnh", "humanizasus", "clínica ampliada"]),
    ("interprofissionalidade", ["interprofissional", "trabalho em equipe", "vínculo",
                                "responsabilização"]),
    ("bioetica",           ["ética", "bioética", "autonomia", "paternalismo",
                             "consentimento", "dignidade", "biomédico"]),
    ("anestesiologia",     ["anestesia", "anestésico", "analgesia", "sedação",
                             "bloqueio", "plano anestésico"]),
    ("semiologia",         ["exame físico", "semiologia", "propedêutica", "palpação",
                             "percussão", "auscultação", "sistema nervoso", "neurolog"]),
    ("grandes-animais",    ["bovino", "equino", "ovino", "caprino", "suíno",
                             "ruminante", "potro", "rebanho", "mastite"]),
    ("patologia",          ["necrose", "degeneração", "atrofia", "hipertrofia",
                             "hiperplasia", "metaplasia", "inflamação", "cicatrização",
                             "neoplasia", "tumor"]),
    ("patologia-clinica",  ["hemograma", "eritrograma", "anemia", "hematócrito",
                             "leucócito", "urina", "proteinúria", "bioquímica"]),
    ("zoonoses",           ["raiva", "mormo", "brucelose", "leptospirose",
                             "leishmaniose", "zoonose"]),
    ("caes-gatos",         ["cão", "gato", "canino", "felino", "pequenos animais",
                             "cardiomiopatia", "cardiopatia"]),
    ("cirurgia",           ["cirurgia", "cirúrgico", "sutura", "antissepsia",
                             "desinfecção", "pré-operatório"]),
    ("farmacologia",       ["fármaco", "medicamento", "posologia", "mecanismo de ação",
                             "antibiótico"]),
    ("epidemiologia",      ["prevalência", "incidência", "epidemiologia", "surto",
                             "vigilância"]),
    ("microbiologia",      ["microbiologia", "bacteriologia", "segurança dos alimentos"]),
    ("imagem",             ["radiografia", "ultrassonografia", "tomografia",
                             "ressonância magnética"]),
    ("teriogenologia",     ["reprodução", "obstetrícia", "gestação", "andrologia",
                             "ginecologia"]),
]

LETTER = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4}


def classify(text: str, categoria: str) -> str:
    t = text.lower()
    for tema_id, kws in TEMAS:
        if any(kw in t for kw in kws):
            return tema_id
    return "sus" if categoria == "geral" else "patologia"


# ─── gabarito ─────────────────────────────────────────────────────────────────
def parse_gabarito(path: Path) -> dict:
    """Retorna {num: letra} para Grupo 5 / Medicina Veterinária.

    Suporta dois formatos:
    - Até 2018: colunas "Grupo 1…5", Veterinária = Grupo 5 (última coluna da pg 0)
    - 2019+: colunas "Profissão 1…N", Veterinária numa das páginas seguintes
    Usa posições X palavra-a-palavra para isolar a coluna correta.
    """
    doc = fitz.open(str(path))

    # Buscar em todas as páginas a palavra que contém "eterin" (Veterinária)
    vet_page = None
    vet_x = None
    for pg_i in range(len(doc)):
        for w in doc[pg_i].get_text("words"):
            txt = w[4].replace('\xa0', '').strip()
            if 'eterin' in txt.lower():
                vet_page = pg_i
                vet_x = w[0]
                break
        if vet_page is not None:
            break

    if vet_x is None:
        raise ValueError("Coluna Veterinária não encontrada no gabarito.")

    # Descobrir x exato das respostas: coletar xs de letras A-E nessa página,
    # pegar o mais próximo de vet_x (com tolerância de 0–80 pts para direita)
    page = doc[vet_page]
    letter_xs = sorted({
        round(w[0]) for w in page.get_text("words")
        if w[4].strip() in ('A', 'B', 'C', 'D', 'E')
    })

    # Coluna de resposta = primeiro x de letra tal que vet_x <= x <= vet_x + 80
    resp_x = None
    for lx in sorted(letter_xs):
        if vet_x - 5 <= lx <= vet_x + 80:
            resp_x = lx
            break
    if resp_x is None:
        resp_x = vet_x  # fallback

    # Agrupar palavras por linha (y arredondado) e extrair respostas
    rows: dict = {}
    for w in page.get_text("words"):
        y_key = round(w[1])
        rows.setdefault(y_key, []).append(w)

    answers = {}
    for _, row_words in sorted(rows.items()):
        row_words.sort(key=lambda w: w[0])

        q_num = None
        answer = None

        for w in row_words:
            txt = w[4].replace('\xa0', '').replace(' ', '').strip()
            x = w[0]

            if re.match(r'^\d{1,2}$', txt) and 1 <= int(txt) <= 30:
                q_num = int(txt)

            # Resposta na coluna Veterinária (x dentro de ±15 do resp_x)
            if abs(x - resp_x) <= 15 and txt in ('A', 'B', 'C', 'D', 'E', 'ANULADA'):
                answer = txt

        if q_num and answer:
            answers[q_num] = answer

    doc.close()
    return answers


# ─── questões ─────────────────────────────────────────────────────────────────
def parse_prova(path: Path) -> dict:
    """Retorna {num: {enunciado, alternativas}}.

    Modo 1: detecta blocos com número isolado (ex: "01") — funciona até 2017.
    Modo 2 (fallback): segmenta por marcadores a)…e) e numera sequencialmente.
    """
    doc = fitz.open(str(path))

    SKIP = {"CONHECIMENTOS GERAIS", "VETERINÁRIA", "GRUPO 5: VETERINÁRIA",
            "GRUPO 5 – VETERINÁRIA", "GRUPO 5-VETERINÁRIA"}
    MIN_FONT = 5  # ignorar watermarks/barcodes

    def all_lines_sorted():
        """Linhas de texto ordenadas por (página, coluna, y).

        A ordem correta para o exame é: dentro de cada página,
        coluna esquerda antes da direita; páginas em sequência.
        """
        result = []
        for pg in range(1, len(doc)):
            page = doc[pg]
            midx = page.rect.width / 2
            page_h = page.rect.height
            for block in page.get_text("dict")["blocks"]:
                if block["type"] != 0:
                    continue
                by = block["bbox"][1]
                # Ignorar cabeçalho (<50pt) e rodapé (>80% altura da página)
                if by < 40 or by > page_h * 0.85:
                    continue
                col = 0 if (block["bbox"][0] + block["bbox"][2]) / 2 < midx else 1
                for line in block["lines"]:
                    sz = line["spans"][0]["size"] if line["spans"] else 0
                    if sz < MIN_FONT:
                        continue
                    txt = "".join(s["text"] for s in line["spans"]).strip()
                    if txt and txt.upper() not in SKIP:
                        result.append({"col": col, "pg": pg,
                                       "y": by, "txt": txt})
        # Ordem: página → coluna → y  (esquerda antes da direita em cada página)
        result.sort(key=lambda l: (l["pg"], l["col"], l["y"]))
        return result

    lines = all_lines_sorted()

    # ── Modo 1: número isolado ───────────────────────────────────────────────
    questions: dict = {}
    cur_q = None
    enunc: list = []
    alts: list = []
    in_alts = False

    def flush1():
        if cur_q and enunc:
            questions[cur_q] = {
                "enunciado": " ".join(enunc).strip(),
                "alternativas": alts[:]
            }

    for ln in lines:
        txt = ln["txt"]
        if re.match(r'^\d{1,2}$', txt) and 1 <= int(txt) <= 30:
            flush1()
            cur_q = int(txt)
            enunc, alts, in_alts = [], [], False
        elif cur_q is None:
            continue
        elif re.match(r'^[a-eA-E]\)', txt):
            in_alts = True
            alts.append(txt)
        elif in_alts and alts:
            alts[-1] += " " + txt
        else:
            enunc.append(txt)

    flush1()

    if len(questions) >= 25:
        doc.close()
        return questions

    # ── Modo 2: fallback por alternativas ────────────────────────────────────
    # Robusto para PDFs com texto justificado onde "a) palavra" fica em linhas
    # separadas (cada palavra numa linha). Fica em modo "alts" até ver as 5
    # alternativas ou uma linha longa com maiúscula (início de novo enunciado).
    questions = {}
    segments: list = []   # (enunciado_str, [alt_a, alt_b, alt_c, alt_d, alt_e])
    cur_enunc: list = []
    cur_alts: list = []
    in_alts = False
    alt_count = 0

    def flush2():
        if cur_enunc and len(cur_alts) >= 4:
            segments.append((" ".join(cur_enunc).strip(), cur_alts[:]))

    def is_new_enunciado(txt: str) -> bool:
        """Heurística: linha longa e com inicial maiúscula = provável novo enunciado."""
        return len(txt) >= 25 and bool(re.match(r'^[A-ZÀ-Ö]', txt))

    for ln in lines:
        txt = ln["txt"]
        alt_match = re.match(r'^([a-eA-E])\)', txt)

        if alt_match:
            letter = alt_match.group(1).lower()
            if not in_alts and letter == 'a':
                # Início das alternativas
                in_alts = True
                alt_count = 1
                cur_alts = [txt]
            elif in_alts:
                alt_count += 1
                cur_alts.append(txt)
            # Ignorar marcadores 'a)' fora de contexto (já temos alts em andamento
            # ou a letra não é 'a' para iniciar)
        elif in_alts:
            # Sair dos alts só quando temos ≥4 alts E o texto parece
            # um enunciado novo (longo, começa com maiúscula).
            # Textos curtos / minúsculos são continuação da última alt.
            if alt_count >= 4 and is_new_enunciado(txt):
                flush2()
                cur_enunc = [txt]
                cur_alts = []
                in_alts = False
                alt_count = 0
            else:
                # Continuação da última alternativa (texto justificado)
                if cur_alts:
                    cur_alts[-1] += " " + txt
        else:
            if not cur_enunc:
                pass
            cur_enunc.append(txt)

    flush2()

    for i, (enunc_txt, alts_list) in enumerate(segments, 1):
        if i <= 30:
            questions[i] = {"enunciado": enunc_txt, "alternativas": alts_list}

    doc.close()
    return questions


# ─── imagens ──────────────────────────────────────────────────────────────────
def extract_images(prova_path: Path, out_dir: Path, ano: str) -> dict:
    """Extrai imagens do PDF e retorna {num: caminho_web}."""
    doc = fitz.open(str(prova_path))
    out_dir.mkdir(parents=True, exist_ok=True)
    result = {}

    for pg in range(1, len(doc)):
        page = doc[pg]
        midx = page.rect.width / 2

        # Posições dos números de questão nesta página
        q_pos = {}
        for block in page.get_text("blocks"):
            t = block[4].strip()
            if re.match(r'^\d{1,2}$', t) and 1 <= int(t) <= 30:
                q_num = int(t)
                cx = (block[0] + block[2]) / 2
                q_pos[q_num] = {"y": block[1], "col": 0 if cx < midx else 1}

        if not q_pos:
            continue

        # Imagens na página (xrefs=True exige PyMuPDF >= 1.18)
        for info in page.get_image_info(xrefs=True):
            bbox = info["bbox"]
            xref = info.get("xref", 0)
            if not xref:
                continue

            w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
            # Ignorar imagens minúsculas (logos, marcas d'água)
            if w < 60 or h < 60:
                continue

            img_cx = (bbox[0] + bbox[2]) / 2
            img_cy = (bbox[1] + bbox[3]) / 2
            img_col = 0 if img_cx < midx else 1

            # Questão mais próxima acima, na mesma coluna
            best_q, best_y = None, -1
            for q_num, qinfo in q_pos.items():
                if qinfo["col"] == img_col and qinfo["y"] <= img_cy and qinfo["y"] > best_y:
                    best_y = qinfo["y"]
                    best_q = q_num

            if best_q is None:
                continue

            try:
                img_data = doc.extract_image(xref)
                ext = img_data.get("ext", "png")
                fname = f"q{best_q:03d}.{ext}"
                (out_dir / fname).write_bytes(img_data["image"])
                result[best_q] = f"/questoes/rp-{ano}/{fname}"
                print(f"  Imagem salva: Q{best_q:02d} -> {fname}")
            except Exception as e:
                print(f"  Erro Q{best_q:02d}: {e}")

    doc.close()
    return result


# ─── main ─────────────────────────────────────────────────────────────────────
def find_pdfs(ano: str):
    """
    Descobre automaticamente prova e gabarito na pasta scripts/provas/.
    Suporta nomes como ProvaResidencia17.pdf, ProvaResidencia18(Fase1).pdf, etc.
    Também aceita caminhos explícitos como argv[2] e argv[3].
    """
    if len(sys.argv) >= 4:
        return Path(sys.argv[2]), Path(sys.argv[3])

    provas_dir = PROJECT / "scripts" / "provas"
    yy = ano[-2:]  # últimos 2 dígitos: 2017 → "17"

    prova = gabarito = None
    for f in provas_dir.iterdir():
        name = f.name.lower()
        if f.suffix.lower() != ".pdf":
            continue
        if f"residencia{yy}" not in name:
            continue
        # Fase1 ou FaseUnica → é a prova objetiva; ignorar Fase2 (dissertativa)
        if "fase2" in name:
            continue
        if "prova" in name:
            prova = f
        elif "gabarito" in name:
            gabarito = f

    return prova, gabarito


def main():
    ano = sys.argv[1] if len(sys.argv) > 1 else None
    if not ano:
        print(__doc__)
        sys.exit(1)

    prova_path, gabarito_path = find_pdfs(ano)

    if not prova_path or not prova_path.exists():
        print(f"Prova não encontrada para RP {ano} em scripts/provas/")
        sys.exit(1)
    if not gabarito_path or not gabarito_path.exists():
        print(f"Gabarito não encontrado para RP {ano} em scripts/provas/")
        sys.exit(1)

    print(f"  Prova:    {prova_path.name}")
    print(f"  Gabarito: {gabarito_path.name}")

    print(f"\n=== Importando RP {ano} ===\n")

    print("Lendo gabarito (Grupo 5)...")
    gabarito = parse_gabarito(gabarito_path)
    print(f"  {len(gabarito)} respostas encontradas\n")

    print("Extraindo questões...")
    questions = parse_prova(prova_path)
    print(f"  {len(questions)} questões extraídas\n")

    print("Extraindo imagens...")
    img_dir = PROJECT / "public" / "questoes" / f"rp-{ano}"
    image_map = extract_images(prova_path, img_dir, ano)
    n_imgs = len(image_map)
    print(f"  {n_imgs} imagens salvas\n" if n_imgs else "  Nenhuma imagem encontrada.\n")

    conteudo = json.loads(CONTEUDO.read_text(encoding="utf-8"))
    existing = {q["id"] for q in conteudo["questoes"]}

    inserted = anuladas = dups = 0
    erros = []

    for n in range(1, 31):
        qid = f"rp_{ano}_{n:03d}"

        if qid in existing:
            dups += 1
            continue

        letra = gabarito.get(n)
        if letra == "ANULADA":
            anuladas += 1
            continue

        if n not in questions:
            erros.append(f"Q{n:02d}: texto não extraído")
            continue

        correta = LETTER.get(str(letra))
        if correta is None:
            erros.append(f"Q{n:02d}: resposta inválida ({letra})")
            continue

        qdata = questions[n]
        categoria = "geral" if n <= 15 else "especifico"

        obj = {
            "id": qid,
            "temaId": classify(qdata["enunciado"], categoria),
            "categoria": categoria,
            "enunciado": qdata["enunciado"],
            "alternativas": qdata["alternativas"],
            "correta": correta,
            "explicacao": "",
            "dificuldade": "media",
            "origem": "rp",
            "anoFuvest": int(ano),
        }

        if n in image_map:
            obj["imagem"] = image_map[n]

        conteudo["questoes"].append(obj)
        inserted += 1

    CONTEUDO.write_text(
        json.dumps(conteudo, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print(f"\nConcluido: {inserted} inseridas . {anuladas} anuladas . {dups} duplicatas")
    if erros:
        print("Erros:")
        for e in erros:
            print(f"  {e}")


if __name__ == "__main__":
    main()
