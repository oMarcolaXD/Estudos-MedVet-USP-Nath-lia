"""
Insere as dissertativas das Provas de Fase 2 (RP 2018 e RP 2019) em conteudo.json.
Baseado na extracao dos PDFs ProvaResidencia18(Fase2).pdf e ProvaResidencia19(Fase2).pdf.
Os pontosEsperados foram gerados com base no conhecimento veterinario (sem API externa).
"""
import json
from pathlib import Path

CONTEUDO_PATH = Path(__file__).parent.parent / "src" / "data" / "conteudo.json"

CASO_2018 = (
    "Cão SRD, macho, 8 anos. 1ª consulta (30/01): poliúria, hematúria, hiporexia e emagrecimento "
    "(15 dias), anorexia e 4 episódios de êmese (3 dias). Desidratação leve, T=37,8°C, massa firme "
    "e dolorosa em lombar direita. Tratamento sintomático + antimicrobiano com melhora. Retorno 2 "
    "meses depois (30/03): poliúria, hematúria, oligodipsia, perda de peso, conjuntivas avermelhadas, "
    "T=39,8°C, desidratação moderada, massa lombar direita sensível à palpação.\n\n"
    "Hemograma 30/01 → 30/03 (VR): Eritrócitos 7,1 → 10,2 (5–8 ×10⁶/μL); Ht 47 → 65% (37–54%); "
    "Hb 16 → 23 g/dL (12–18); Leucócitos 17.100 → 19.300 /μL (6.000–15.000); Bastonetes 0 → 193; "
    "Segmentados 15.390 → 17.370; Linfócitos 1.026 → 965 (1.500–5.000); Monócitos 684 → 579.\n\n"
    "Bioquímica 30/01 → 30/03 (VR): Ureia 108 → 180 mg/dL (até 40); Creatinina 2,4 → 2,8 (até 1,4); "
    "PT 6,0 → 5,5 g/dL; Albumina 2,5 → 2,3 g/dL (2,5–3,8); ALT 44 → 50 U/L (até 50).\n\n"
    "Urinálise 30/01 → 30/03: densidade 1.025 → 1.018; aspecto turvo; cor citrina → avermelhada; "
    "proteína + → ++; hemoglobina + → +++; hemácias incontáveis; leucócitos 4–5 → 20–30/campo; "
    "cilindros granulosos 3–4 → 0–1; células de epitélio renal +++; bactérias ++ → +++."
)

CASO_2019 = (
    "Cão pit bull, macho, 13 anos. Hiporexia e emagrecimento progressivo (2 meses), aumento de volume "
    "e sensibilidade abdominal, diarreia (2 dias). Sem êmese, sem alterações urinárias. Vacinado. "
    "Exame físico: desidratação leve, T=37,7°C, mucosas pálidas, ascite (líquido livre em abdômen).\n\n"
    "Hemograma (VR): Eritrócitos 1,1 (5–8 ×10⁶/μL); Ht 9% (37–54%); Hb 2,6 g/dL (12–18); "
    "VCM 83 µ³ (60–77); CHCM 28% (31–36); hipocromia (++), policromasia (++), anisocitose (++). "
    "Leucócitos 18.000 (6.000–15.000); Segmentados 15.300; Linfócitos 1.300 (1.500–5.000); "
    "Monócitos 1.400 (0–800); Plaquetas 160 ×10³/µL (200–500).\n\n"
    "Bioquímica: Ureia 62,3 mg/dL (até 40); Creatinina 0,9 (até 1,4); Albumina 3,0 g/dL; "
    "ALT 120 U/L (até 50); FA 80 U/L (até 70).\n\n"
    "USG abdominal: cistos anecoicos hepáticos (~1,62 e 1,36 cm); grande quantidade de líquido livre."
)

dissertativas = [
    # ====== RP 2018 - Fase 2 ======
    {
        "id": "rp_2018_f2_q1",
        "temaId": "patologia-clinica",
        "anoFuvest": 2018,
        "origem": "rp",
        "caso": (
            CASO_2018 + "\n\n"
            "QUESTÃO 1 (2,0 pontos): Interprete o hemograma e a bioquímica sérica, caracterizando todas "
            "as alterações e relacionando-as à clínica do animal."
        ),
        "pontosEsperados": [
            "1ª consulta: leucocitose com neutrofilia (17.100) e linfopenia (1.026) — padrão inflamatório/estresse; eritrograma normal.",
            "2ª consulta: policitemia absoluta (eritrócitos 10,2; Ht 65%; Hb 23 — acima dos VR) compatível com síndrome paraneoplásica por produção ectópica de eritropoetina pelo tumor renal.",
            "Leucocitose com desvio à esquerda regenerativo (bastonetes 193) e neutrofilia: processo inflamatório sistêmico progressivo; linfopenia persistente.",
            "Azotemia progressiva (ureia 108→180; creatinina 2,4→2,8): insuficiência renal em piora por destruição do parênquima renal pela neoplasia.",
            "Hipoalbuminemia (2,5→2,3 g/dL): perda proteica urinária (proteinúria) + catabolismo tumoral; correlaciona-se com emagrecimento.",
            "Correlação clínica: poliúria/oligodipsia + azotemia = perda da concentração urinária; conjuntivas avermelhadas + febre = processo inflamatório/neoplásico; emagrecimento = catabolismo tumoral."
        ],
        "comentario": (
            "O diagnóstico final foi carcinoma de células renais (padrão papilar) no rim direito. "
            "A policitemia paraneoplásica ocorre pela produção ectópica de eritropoetina pelo tecido tumoral — "
            "achado clássico de neoplasias renais em cães. A progressão da azotemia reflete a destruição "
            "crescente do parênquima renal funcional."
        )
    },
    {
        "id": "rp_2018_f2_q2",
        "temaId": "patologia-clinica",
        "anoFuvest": 2018,
        "origem": "rp",
        "caso": (
            CASO_2018 + "\n\n"
            "QUESTÃO 2 (2,0 pontos): Interprete os exames de urina, caracterizando todas as alterações "
            "e relacionando-as à clínica do animal. Com base nos exames de urina, você solicitaria "
            "outro(s) exame(s) laboratorial(is)?"
        ),
        "pontosEsperados": [
            "1ª consulta: hematúria microscópica (hemácias incontáveis) + proteinúria (+) + bacteriúria (++) + piúria leve = nefrite com infecção bacteriana secundária (ITU).",
            "Células epiteliais renais (+++) = descamação ativa do epitélio tubular, indicando lesão do parênquima renal.",
            "Cilindros granulosos (3–4/campo): formados por debris celulares tubulares, confirmam lesão tubular renal.",
            "2ª consulta: piora — hematúria macroscópica (cor avermelhada, hemoglobina +++), piúria intensa (20–30), bacteriúria grave (+++), exfoliação urotelial (++) = invasão das vias urinárias pela neoplasia.",
            "Densidade 1.018 na 2ª consulta: redução em relação à 1ª (1.025), refletindo piora da capacidade de concentração renal.",
            "Exames complementares indicados: (1) urocultura e antibiograma — bacteriúria em ambas as coletas; (2) USG abdominal — extensão da massa e invasão de adjacências; (3) radiografia torácica — metástases pulmonares."
        ],
        "comentario": (
            "A progressão dos achados urinários reflete a evolução do carcinoma renal: de inflamação renal inicial "
            "com ITU secundária para invasão ativa das vias urinárias pela neoplasia. A urocultura é mandatória "
            "antes de qualquer procedimento cirúrgico para direcionar o antimicrobiano adequado."
        )
    },
    {
        "id": "rp_2018_f2_q3",
        "temaId": "patologia-clinica",
        "anoFuvest": 2018,
        "origem": "rp",
        "caso": (
            CASO_2018 + "\n\n"
            "O resultado do exame de material obtido do rim direito revelou: 'proliferação neoplásica de "
            "crescimento infiltrativo com formações papilares constituídas por finos feixes conjuntivos "
            "centrais e células epiteliais moderadamente pleomórficas com citoplasma eosinofílico escasso "
            "a moderado, núcleos redondos ou ovoides, hipercromáticos ou vesiculosos com nucléolo evidente.'\n\n"
            "QUESTÃO 3 (1,0 ponto): Que conduta e que possíveis exames foram realizados para se chegar a esse resultado?"
        ),
        "pontosEsperados": [
            "O laudo descreve carcinoma de células renais de padrão papilar (adenocarcinoma renal tubular-papilar) — neoplasia renal mais frequente em cães.",
            "Para obter material para histopatologia: (a) biópsia renal guiada por USG (agulha Tru-cut); ou (b) biópsia incisional/excisional durante laparotomia exploratória.",
            "Estadiamento prévio: USG abdominal (massa, invasão de cava e linfonodos); radiografia torácica (metástases pulmonares); hemograma e bioquímica completos.",
            "PAAF pode fornecer citologia prévia, mas a histopatologia de fragmento é necessária para diagnóstico definitivo e classificação do tipo tumoral."
        ],
        "comentario": (
            "O padrão histológico com formações papilares, células epiteliais pleomórficas e nucléolos evidentes "
            "são critérios de malignidade do carcinoma renal tubular-papilar. O estadiamento completo é essencial "
            "para definir a presença de metástases e orientar a decisão cirúrgica."
        )
    },
    {
        "id": "rp_2018_f2_q4",
        "temaId": "anestesiologia",
        "anoFuvest": 2018,
        "origem": "rp",
        "caso": (
            CASO_2018 + "\n\n"
            "Condição atual (30/03): desidratação moderada, T=39,8°C, azotemia grave (ureia 180, creatinina 2,8), "
            "policitemia (Ht 65%), hipoalbuminemia (albumina 2,3 g/dL), leucocitose com desvio à esquerda.\n\n"
            "QUESTÃO 4 (2,5 pontos): Supondo que o clínico indicasse o tratamento cirúrgico, qual seria a "
            "classificação desse animal segundo a categoria de risco e quais os exames e cuidados "
            "pré-operatórios recomendados?"
        ),
        "pontosEsperados": [
            "Classificação ASA III–IV: doença sistêmica grave (insuficiência renal progressiva, policitemia paraneoplásica, hipoalbuminemia, febre, desidratação moderada) com risco anestésico elevado.",
            "Exames pré-operatórios: hemograma; bioquímica renal (ureia, creatinina); coagulograma (TP, TTPa, fibrinogênio); proteína total e albumina; urinálise + urocultura; radiografia torácica; ECG.",
            "Fluidoterapia IV com cristaloide isotônico para correção da desidratação e pré-hidratação renal; antimicrobiano baseado na urocultura para controle da ITU.",
            "Tipagem sanguínea e reserva de sangue compatível: risco real de hemorragia intraoperatória ao manipular o pedículo renal vascularizado.",
            "Protocolo anestésico: evitar fármacos nefrotóxicos (AINEs, aminoglicosídeos); anestesia balanceada (opioide + inalatório); analgesia epidural para reduzir necessidade de anestésicos sistêmicos; jejum 8–12h alimentar e 2–4h hídrico.",
            "Monitoração peri-operatória: pressão arterial, temperatura, débito urinário (sonda uretral), SpO2, capnografia, hematócrito seriado."
        ],
        "comentario": (
            "O manejo pré-operatório é tão crítico quanto a técnica cirúrgica em pacientes ASA III–IV. "
            "A policitemia aumenta a viscosidade sanguínea e o risco tromboembólico; a insuficiência renal "
            "torna obrigatória a proteção renal com hidratação vigorosa. A avaliação criteriosa reduz mortalidade peri-operatória."
        )
    },
    {
        "id": "rp_2018_f2_q5",
        "temaId": "cirurgia",
        "anoFuvest": 2018,
        "origem": "rp",
        "caso": (
            CASO_2018 + "\n\n"
            "Diagnóstico confirmado: carcinoma de células renais (padrão papilar) no rim direito. "
            "Tratamento cirúrgico indicado: nefrectomia total do rim direito.\n\n"
            "QUESTÃO 5 (2,5 pontos): Supondo a nefrectomia como a indicação mais adequada para o caso, "
            "descreva a técnica, do início ao final do procedimento."
        ),
        "pontosEsperados": [
            "Posicionamento: decúbito dorsal (laparotomia abdominal transperitoneal); tricotomia ampla e antissepsia cirúrgica.",
            "Acesso: laparotomia mediana ou paramediana direita; incisão de pele, subcutâneo, linha alba e peritônio; afastador de Balfour para exposição.",
            "Exploração da cavidade: avaliar linfonodos regionais, fígado e baço quanto a metástases antes de prosseguir.",
            "Exposição do rim direito: afastar alças intestinais com compressas úmidas; identificar e mobilizar cuidadosamente o rim, preservando as estruturas adjacentes.",
            "Ligadura vascular do pedículo renal: identificar artéria e veia renais; dupla ligadura com fio absorvível (PDS 2-0) ou transfixante; cortar entre as ligaduras; hemostasia completa obrigatória.",
            "Dissecção e ligadura do ureter: seguir até próximo à junção ureterovesical; dupla ligadura e secção.",
            "Fechamento por planos: peritônio + linha alba (fio absorvível); subcutâneo (fio absorvível); pele (náilon, padrão interrompido).",
            "Pós-operatório imediato: monitorar débito urinário (função renal contralateral), analgesia multimodal, fluidoterapia, hematócrito seriado."
        ],
        "comentario": (
            "A nefrectomia em cão com insuficiência renal contralateral requer avaliação cuidadosa da função renal "
            "contralateral antes da cirurgia. A dupla ligadura do pedículo vascular é fundamental — a artéria renal "
            "é ramo da aorta e falha hemostática é fatal. O débito urinário no pós-operatório imediato confirma "
            "a função do rim remanescente."
        )
    },

    # ====== RP 2019 - Fase 2 ======
    {
        "id": "rp_2019_f2_q1",
        "temaId": "patologia-clinica",
        "anoFuvest": 2019,
        "origem": "rp",
        "caso": (
            CASO_2019 + "\n\n"
            "QUESTÃO 1 (2,0 pontos): Interprete o hemograma e a bioquímica sérica, caracterizando todas "
            "as alterações e relacionando-as à situação clínica do animal."
        ),
        "pontosEsperados": [
            "Anemia GRAVE (eritrócitos 1,1; Ht 9%; Hb 2,6 — muito abaixo dos VR): explica mucosas pálidas, prostração e emagrecimento.",
            "Caráter regenerativo (macrocitose VCM 83; hipocromia CHCM 28; policromasia ++ = reticulocitose): medula respondendo, indicando anemia por perda hemorrágica ou hemólise — não aplasia.",
            "Padrão macrocítico hipocrômico regenerativo compatível com hemorragia interna crônica (hemoperitônio por ruptura de massa vascular) — principal hipótese neste contexto.",
            "Leucocitose (18.000) com neutrofilia e monocitose acentuada (1.400 — acima do VR 0–800): monocitose marcada é resposta fagocítica clássica a processos necróticos/neoplásicos (hemangiosarcoma).",
            "Trombocitopenia leve (160 ×10³): consumo por hemorragia/neoplasia; pode evoluir para CID.",
            "Azotemia pré-renal (ureia 62,3 com creatinina NORMAL 0,9): hipoperfusão renal por anemia/hipovolemia — descarta insuficiência renal primária.",
            "ALT elevada (120, 2,4× o VR) + FA elevada (80): lesão hepatocelular — associada a cistos hepáticos e/ou infiltração neoplásica (metástases de HSA).",
            "Correlação: ascite + anemia regenerativa grave + monocitose = hemoperitônio por ruptura de hemangiosarcoma esplênico ou hepático — principal diagnóstico diferencial em cão idoso."
        ],
        "comentario": (
            "O hemangiosarcoma esplênico é a neoplasia mais comum causando hemoperitônio em cães de grande porte "
            "acima de 10 anos. A tríade anemia regenerativa grave + monocitose + ascite hemorrágica é altamente "
            "sugestiva. ALT elevada pode indicar metástases hepáticas, frequentes no HSA esplênico."
        )
    },
    {
        "id": "rp_2019_f2_q2a",
        "temaId": "imagem",
        "anoFuvest": 2019,
        "origem": "rp",
        "caso": (
            CASO_2019 + "\n\n"
            "QUESTÃO 2a (1,0 ponto): Analisando o exame ultrassonográfico e considerando os exames "
            "laboratoriais apresentados, deve-se solicitar outro exame complementar? Justifique sua resposta."
        ),
        "pontosEsperados": [
            "Sim, exames complementares adicionais são indicados para melhor caracterização e estadiamento.",
            "Abdominocentese diagnóstica: análise do líquido ascítico (aspecto, proteína, eritrócitos livres, citologia). Líquido hemorrágico com hematócrito próximo ao periférico = hemoperitônio — diferencia de transudato ou exsudato séptico.",
            "Radiografia torácica (3 posições): pesquisa de metástases pulmonares (HSA metastatiza precocemente para pulmão) e derrame pleural.",
            "Ecocardiograma: descartar hemangiosarcoma atrial direito — presente em até 25% dos casos de HSA esplênico; altera significativamente o prognóstico e a decisão cirúrgica.",
            "Tipagem sanguínea e prova de compatibilidade cruzada: necessárias antes da cirurgia com Ht de 9%.",
            "Sorologia para Ehrlichia canis (SNAP 4Dx): erliquiose pode causar anemia, trombocitopenia e ascite — diagnóstico diferencial importante."
        ],
        "comentario": (
            "A abdominocentese é o exame mais rápido e informativo: o caráter do líquido direciona imediatamente "
            "o diagnóstico. O ecocardiograma é frequentemente esquecido mas é fundamental antes da esplenectomia "
            "suspeita de HSA — massa atrial direita é achada em ~25% dos casos e altera o prognóstico e plano cirúrgico."
        )
    },
    {
        "id": "rp_2019_f2_q2b",
        "temaId": "cirurgia",
        "anoFuvest": 2019,
        "origem": "rp",
        "caso": (
            CASO_2019 + "\n\n"
            "Abdominocentese: líquido hemorrágico. Radiografia torácica: sem metástases evidentes. "
            "Ecocardiograma: sem alterações cardíacas.\n\n"
            "QUESTÃO 2b (1,0 ponto): Qual a conduta indicada para o diagnóstico do processo?"
        ),
        "pontosEsperados": [
            "Laparotomia exploratória: conduta diagnóstica e terapêutica de escolha — confirma a fonte do sangramento, identifica a massa, avalia extensão e permite esplenectomia.",
            "Durante a laparotomia: avaliar todo o abdômen (fígado, linfonodos, peritônio); coletar amostra do líquido para citologia; remover a massa inteira para histopatologia — diagnóstico definitivo só é possível pelo exame histológico.",
            "PAAF guiada por USG da massa é contraindicada: risco de hemorragia grave por punção de lesão vascular + baixa sensibilidade diagnóstica para HSA.",
            "Esplenectomia total: tratamento padrão para HSA esplênico; pode ser paliativa (sobrevida mediana 1–2 meses) ou combinada com quimioterapia com doxorrubicina (sobrevida até 6 meses)."
        ],
        "comentario": (
            "O diagnóstico definitivo de HSA só é possível pela histopatologia da peça cirúrgica. "
            "PAAF tem baixa sensibilidade (células em meio a eritrócitos) e risco real de hemorragia. "
            "Em hemoperitônio ativo, a laparotomia é simultaneamente diagnóstica e terapêutica."
        )
    },
    {
        "id": "rp_2019_f2_q3",
        "temaId": "anestesiologia",
        "anoFuvest": 2019,
        "origem": "rp",
        "caso": (
            CASO_2019 + "\n\n"
            "Procedimento cirúrgico indicado: laparotomia exploratória + esplenectomia.\n\n"
            "QUESTÃO 3 (2,0 pontos): Uma vez sendo indicado o procedimento cirúrgico, qual a classificação "
            "de risco desse animal e quais os cuidados pré-operatórios?"
        ),
        "pontosEsperados": [
            "Classificação ASA IV–V (emergência): anemia grave (Ht 9%), choque hipovolêmico iminente, comprometimento sistêmico severo, risco imediato de vida.",
            "Estabilização hemodinâmica urgente: fluidoterapia de ressuscitação com cristaloide isotônico (bolus de NaCl 0,9% ou Ringer Lactato); coloides se necessário; manter PA sistólica > 80 mmHg.",
            "Transfusão sanguínea pré-operatória: com Ht 9%, transfusão de concentrado de hemácias ou sangue total compatível para elevar Ht acima de 20% antes da cirurgia; tipagem e prova de compatibilidade cruzada obrigatórias.",
            "Oxigenoterapia: cateter nasal ou máscara para melhorar oferta de O₂ aos tecidos.",
            "Coagulograma pré-operatório (TP, TTPa, fibrinogênio, plaquetas): risco de CID em animais com hemoperitônio e neoplasia vascular.",
            "Protocolo anestésico: etomidato IV (1–2 mg/kg) para indução em paciente hipovolêmico — menor depressão cardiovascular; isoflurano para manutenção; analgesia com opioides (fentanil); NUNCA usar acepromazina em paciente hipovolêmico.",
            "Acesso venoso calibroso (≥ 18G), idealmente 2 acessos; monitoração contínua de FC, PA, SpO2, temperatura."
        ],
        "comentario": (
            "Pacientes com HSA e hemoperitônio são emergências, mas a estabilização mínima (transfusão + fluidos) "
            "antes da cirurgia reduz significativamente a mortalidade anestésica. O etomidato é o agente de "
            "indução de escolha em pacientes em choque. Acepromazina é absolutamente contraindicada — causa "
            "vasodilatação e colapso cardiovascular em hipovolêmicos."
        )
    },
    {
        "id": "rp_2019_f2_q4",
        "temaId": "cirurgia",
        "anoFuvest": 2019,
        "origem": "rp",
        "caso": (
            CASO_2019 + "\n\n"
            "Animal estabilizado com transfusão (Ht pré-op: 22%) e fluidos. Diagnóstico suspeito: "
            "hemangiosarcoma esplênico com hemoperitônio.\n\n"
            "QUESTÃO 4 (2,0 pontos): Supondo que o procedimento cirúrgico tenha sido realizado, "
            "descreva a técnica cirúrgica do início ao fim."
        ),
        "pontosEsperados": [
            "Posicionamento: decúbito dorsal; tricotomia ampla (xifoide ao púbis + flancos); antissepsia com clorexidina degermante + alcoólica; campo estéril.",
            "Acesso: laparotomia mediana ampla (linha alba, do xifoide ao púbis) para boa exposição da cavidade.",
            "Exploração: aspirar o hemoperitônio (amostra para citologia); identificar a massa esplênica; avaliar todo o abdômen (fígado, linfonodos, peritônio, omento) para estadiamento intraoperatório.",
            "Esplenectomia total: ligadura progressiva dos vasos hílares com dupla ligadura em fio absorvível (PDS ou Vicryl 2-0) ou grampeador vascular (TA/GIA). Seccionar ligamentos gastroesplênico (atenção aos vasos gástricos curtos), esplenocólico e frenicosplênico.",
            "Remover o baço inteiro (não fragmentado) e enviar para histopatologia.",
            "Inspecionar o fígado: biópsia de lesões suspeitas.",
            "Hemostasia final, lavagem da cavidade com NaCl 0,9% morno.",
            "Fechamento por planos: linha alba com PDS 0 (padrão Sultan ou contínuo); subcutâneo com fio absorvível; pele com náilon ou grampos.",
            "Pós-operatório imediato: Ht e coagulograma 6h e 24h; analgesia multimodal; antibioticoprofilaxia; monitoração cardiovascular."
        ],
        "comentario": (
            "A esplenectomia é tecnicamente acessível, mas o maior risco é a hemorragia por falha hemostática. "
            "O grampeador vascular (TA/GIA) acelera e aumenta a segurança em massas volumosas. O baço deve ser "
            "removido inteiro — fragmentação durante a cirurgia pode causar esplenose peritoneal. "
            "Biópsia hepática intraoperatória é fundamental para estadiamento e prognóstico."
        )
    },
    {
        "id": "rp_2019_f2_q5",
        "temaId": "patologia-clinica",
        "anoFuvest": 2019,
        "origem": "rp",
        "caso": (
            CASO_2019 + "\n\n"
            "24 horas após esplenectomia: mucosas hipocoradas, prostração, hipotensão arterial, "
            "taquicardia ventricular.\n\n"
            "Exames 24h pós-op: Ht 14%; Hb 4,1 g/dL; Bastonetes 300; Linfócitos 420; Monócitos 1.200; "
            "Plaquetas 130 ×10³/µL. Ureia 43,8; ALT 291,2 U/L (até 50); FA 77,5 U/L (até 70). "
            "Coagulação: TP 11,1s (VR 6,8–10,2s); TTPa 41,6s (VR 10,7–16,4s); Fibrinogênio 130 mg/dL (VR 200–400).\n\n"
            "QUESTÃO 5 (2,0 pontos): Com essas manifestações clínicas e os resultados dos exames "
            "laboratoriais, qual conduta deve ser adotada?"
        ),
        "pontosEsperados": [
            "Diagnóstico: Coagulação Intravascular Disseminada (CID) pós-operatória — tríade: TP alargado (11,1s > VR 10,2s), TTPa muito alargado (41,6s > VR 16,4s), fibrinogênio baixo (130 < VR 200), trombocitopenia (130).",
            "Anemia grave persistente (Ht 14%): resangramento pós-operatório ou destruição de hemácias; linfopenia (420) + monocitose = estresse pós-cirúrgico/séptico.",
            "ALT 291,2 (5,8× o VR): lesão hepatocelular aguda por hipóxia/hipoperfusão (anemia + hipotensão) e/ou metástases hepáticas do HSA.",
            "Taquicardia ventricular: arritmia por hipóxia tecidual (Ht 14%), dor, distúrbios eletrolíticos ou cardiotoxicidade por HSA atrial.",
            "Conduta para CID: transfusão de plasma fresco congelado — repõe fatores de coagulação, fibrinogênio e proteínas; crioprecipitado se disponível (rico em fibrinogênio e fator VIII); concentrado de hemácias para corrigir anemia grave.",
            "Tratamento da taquicardia ventricular: lidocaína IV bolus (2 mg/kg) + infusão contínua (50–80 µg/kg/min) se TV sustentada e hemodinamicamente instável; cardioversão elétrica se refratária. Corrigir a anemia primeiro — hipóxia é a causa primária.",
            "Suporte intensivo: oxigenoterapia; fluidoterapia cuidadosa; ECG contínuo; PA invasiva; débito urinário horário; analgesia adequada.",
            "Investigar resangramento ativo: USG da cavidade para avaliar hematoma ou sangramento no leito cirúrgico; hemostasia cirúrgica se necessária."
        ],
        "comentario": (
            "A CID é a complicação mais temida no pós-operatório de HSA. O tecido neoplásico libera "
            "tromboplastina, ativando a cascata da coagulação de forma sistêmica e consumindo fatores e plaquetas. "
            "O plasma fresco congelado é o tratamento de escolha. IMPORTANTE: trate a anemia grave ANTES de "
            "usar antiarrítmicos que deprimem o débito cardíaco — a taquicardia ventricular aqui é "
            "provavelmente secundária à hipóxia, e a lidocaína pode precipitar colapso."
        )
    }
]


def main():
    with open(CONTEUDO_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    existing_ids = {d["id"] for d in data.get("dissertativas", [])}
    to_insert = [d for d in dissertativas if d["id"] not in existing_ids]
    skipped = [d["id"] for d in dissertativas if d["id"] in existing_ids]

    if skipped:
        print(f"Pulando (ja existem): {skipped}")

    data.setdefault("dissertativas", []).extend(to_insert)

    with open(CONTEUDO_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Inseridas: {len(to_insert)} dissertativas")
    print(f"Total dissertativas agora: {len(data['dissertativas'])}")


if __name__ == "__main__":
    main()
