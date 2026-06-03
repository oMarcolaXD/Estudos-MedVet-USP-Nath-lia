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
    """Retorna {num: letra} para Grupo 5 – Veterinária."""
    doc = fitz.open(str(path))
    page = doc[0]

    # Achar x0 do cabeçalho "Grupo 5"
    grupo5_x = None
    for block in page.get_text("blocks"):
        if "Grupo 5" in block[4] or "Veterinária" in block[4]:
            grupo5_x = block[0]

    if grupo5_x is None:
        # fallback: última coluna (rightmost header block)
        headers = [b for b in page.get_text("blocks") if re.search(r'Grupo\s+\d', b[4])]
        if headers:
            grupo5_x = max(h[0] for h in headers)

    if grupo5_x is None:
        raise ValueError("Não encontrei 'Grupo 5' no gabarito.")

    answers = {}
    col_x = grupo5_x - 15

    for block in page.get_text("blocks"):
        if block[0] < col_x:
            continue
        for m in re.finditer(r'(\d{2})\s+(ANULADA|[A-E])', block[4]):
            answers[int(m.group(1))] = m.group(2)

    doc.close()
    return answers


# ─── questões ─────────────────────────────────────────────────────────────────
def parse_prova(path: Path) -> dict:
    """Retorna {num: {enunciado, alternativas}}."""
    doc = fitz.open(str(path))
    questions: dict = {}

    SKIP = {"CONHECIMENTOS GERAIS", "VETERINÁRIA", "GRUPO 5: VETERINÁRIA",
            "GRUPO 5 – VETERINÁRIA", "GRUPO 5-VETERINÁRIA"}

    for pg in range(1, len(doc)):
        page = doc[pg]
        midx = page.rect.width / 2

        # Ordenar blocos de texto: coluna esquerda antes, depois por y
        blocks = [b for b in page.get_text("dict")["blocks"] if b["type"] == 0]
        blocks.sort(key=lambda b: (
            0 if (b["bbox"][0] + b["bbox"][2]) / 2 < midx else 1,
            b["bbox"][1]
        ))

        cur_q = None
        enunc = []
        alts = []
        in_alts = False

        def flush():
            if cur_q and enunc:
                questions[cur_q] = {
                    "enunciado": " ".join(enunc).strip(),
                    "alternativas": alts[:]
                }

        for block in blocks:
            for line in block["lines"]:
                txt = "".join(s["text"] for s in line["spans"]).strip()
                if not txt or txt.upper() in SKIP:
                    continue

                # Número de questão isolado
                if re.match(r'^\d{1,2}$', txt) and 1 <= int(txt) <= 30:
                    flush()
                    cur_q = int(txt)
                    enunc, alts, in_alts = [], [], False
                    continue

                if cur_q is None:
                    continue

                # Alternativa: a) … e)
                if re.match(r'^[a-eA-E]\)', txt):
                    in_alts = True
                    alts.append(txt)
                elif in_alts and alts:
                    alts[-1] += " " + txt
                else:
                    enunc.append(txt)

        flush()

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
                print(f"  Imagem salva: Q{best_q:02d} → {fname}")
            except Exception as e:
                print(f"  Erro Q{best_q:02d}: {e}")

    doc.close()
    return result


# ─── main ─────────────────────────────────────────────────────────────────────
def main():
    ano = sys.argv[1] if len(sys.argv) > 1 else None
    if not ano:
        print(__doc__)
        sys.exit(1)

    prova_dir = PROJECT / "scripts" / "provas" / f"rp-{ano}"
    prova_path = prova_dir / "prova.pdf"
    gabarito_path = prova_dir / "gabarito.pdf"

    for p in (prova_path, gabarito_path):
        if not p.exists():
            print(f"Arquivo não encontrado: {p}")
            sys.exit(1)

    print(f"\n📚 Importando RP {ano}...\n")

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

    print(f"✅ Concluído: {inserted} inseridas · {anuladas} anuladas · {dups} duplicatas")
    if erros:
        print("Erros:")
        for e in erros:
            print(f"  {e}")


if __name__ == "__main__":
    main()
