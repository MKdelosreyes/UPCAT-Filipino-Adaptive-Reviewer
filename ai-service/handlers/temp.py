# Structure for each evaluation sample
# evaluation_sample = {
#     "id": "sample_001",
#     "exercise_type":  "vocabulary_meaning",
#     "module": "Vocabulary",
#     "correct_answer": "B. Hangarin",
#     "student_answer": "A. Pagkain",

#     # What the RAG system retrieved
#     "retrieved_context": "Retrieved context from knowledge bases.. .",

#     # What the AI generated
#     "generated_explanation":  "The AI-generated explanation...",

#     # Ground truth (prepared by Filipino experts)
#     "reference_explanation": "The expert-written reference explanation..."
# }

# =========== CLOSEST MEANING ITEMS ==========
# item1 = await collect_single_sample(
#     sample_id="vocab_001",
#     mode="quiz",
#     word="nagbunsod",
#     correct="sanhi",
#     selected="kaagapay",
# )
# samples.append(item1)

# item2 = await collect_single_sample(
#     sample_id="vocab_002",
#     mode="quiz",
#     word="simbuyo",
#     correct="silakbo",
#     selected="nilalakbay",
# )
# samples.append(item2)

# item3 = await collect_single_sample(
#     sample_id="vocab_003",
#     mode="quiz",
#     word="susog",
#     correct="siyasat",
#     selected="dalampasigan",
# )
# samples.append(item3)

# item4 = await collect_single_sample(
#     sample_id="vocab_004",
#     mode="quiz",
#     word="silakbo",
#     correct="matindi",
#     selected="kariktan",
# )
# samples.append(item4)

# item5 = await collect_single_sample(
#     sample_id="vocab_005",
#     mode="quiz",
#     word="pagtangis",
#     correct="pagluha",
#     selected="maalab",
# )
# samples.append(item5)

# # =========== ANTONYM ITEMS ==========
# item6 = await collect_single_sample(
#     sample_id="vocab_006",
#     mode="antonym",
#     word="nagkamal",
#     correct="nagwaldas",
#     selected="humpay",
# )
# samples.append(item6)

# item7 = await collect_single_sample(
#     sample_id="vocab_007",
#     mode="antonym",
#     word="biyaya",
#     correct="kapinsalan",
#     selected="ilanlang",
# )
# samples.append(item7)

# item8 = await collect_single_sample(
#     sample_id="vocab_008",
#     mode="antonym",
#     word="pagtalima",
#     correct="sumuway",
#     selected="tuyot",
# )
# samples.append(item8)

# item9 = await collect_single_sample(
#     sample_id="vocab_009",
#     mode="antonym",
#     word="alindog",
#     correct="kapangitan",
#     selected="marubdob",
# )
# samples.append(item9)

# item10 = await collect_single_sample(
#     sample_id="vocab_010",
#     mode="antonym",
#     word="nabalisa",
#     correct="kalmado",
#     selected="hiyas",
# )
# samples.append(item10)

vocab_data = [
    {
        "id": "vocab_001",
        "exercise_type": "quiz",
        "correct_answer": "sanhi",
        "student_answer": "kaagapay",
        "contexts": [
            "[COMMON MISTAKE] Ligature and Function Word Errors: Errors involving ligatures and function words such as 'na', '-ng', and misuse of 'nang' vs 'ng'.",
            "[COMMON MISTAKE] Incorrect Affix Spacing (pa + na): Incorrect joining of 'pa' + 'na' forms into one unit, e.g., 'palang', 'parin' instead of correct separate forms.",
            "[VOCABULARY] bunsod: Sanhi o dahilan na nagtutulak sa isang pangyayari o kilos.",
            "[VOCABULARY] bulay: Ang malalim na pagsusuri o pag-iisip tungkol sa isang bagay."
        ],
        "answer": "1. Ang \"sanhi\" ang tamang sagot dahil ito ang kahulugan ng salitang \"bunsod\" ayon sa nabanggit na reference material, na tumutukoy sa dahilan o sanhi na nagtutulak sa isang pangyayari o kilos. Ito ay sumasalamin sa opisyal na kahulugan ng \"bunsod\" na nakasaad sa reference material.\n\n2. Ang \"kaagapay\" ay mali dahil hindi ito ang kahulugan ng salitang \"bunsod\", at wala ito sa listahan ng kasingkahulugan ng \"bunsod\" na nakasaad sa reference material, at hindi rin ito isang karaniwang pagkakamali na nakatala sa mga common mistake patterns, kaya't ito ay isang hiwalay na pagkakamali.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 4,
            "sources": [
                "mistakes",
                "vocabulary"
            ],
            "avg_relevance": 0.8911593176336744,
            "query": "Filipino word: nagbunsod. Definition: Sanhi o dahilan na nagtutulak sa isang pangyayari o kilos. | Filipino word: nagbunsod | Student selected: kaagapay | Correct answer: sanhi",
            "context_type": "vocabulary"
        }
    },
    {
        "id": "vocab_002",
        "exercise_type": "quiz",
        "correct_answer": "silakbo",
        "student_answer": "nilalakbay",
        "contexts": [
            "[COMMON MISTAKE] Ng vs. Nang misuse: Confusion between the Filipino function words 'ng' and 'nang', often misused in place of one another.",
            "[COMMON MISTAKE] Ligature and Function Word Errors: Errors involving ligatures and function words such as 'na', '-ng', and misuse of 'nang' vs 'ng'.",
            "[VOCABULARY] bulay: Ang malalim na pagsusuri o pag-iisip tungkol sa isang bagay.",
            "[VOCABULARY] pasanin: Isang mabigat na tungkulin, problema, o obligasyong kailangang harapin."
        ],
        "answer": "1. Ang \"silakbo\" ang tamang sagot dahil ito ang kahulugan na tumutukoy sa biglaan at matinding pag-usbong o pagsabog ng damdamin, na katulad ng kahulugan ng salitang \"simbuyo\". Ito ay sumasalamin sa opisyal na kahulugan ng salita, kaya't ito ang pinakanaangkop na sagot.\n\n2. Ang napiling sagot na \"nilalakbay\" ay mali dahil ito ay hindi tumutukoy sa biglaan at matinding pag-usbong o pagsabog ng damdamin, at hindi ito katulad ng kahulugan ng salitang \"simbuyo\". Ito ay maaaring isang halimbawa ng pagkakamali sa paggamit ng ligature at function words, na isang karaniwang pagkakamali sa paggamit ng wikang Filipino.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 4,
            "sources": [
                "mistakes",
                "vocabulary"
            ],
            "avg_relevance": 0.8209247449782865,
            "query": "Filipino word: simbuyo. Definition: Tumutukoy sa biglaan at matinding pag-usbong o pagsabog ng damdamin na kadalasang nagmumula sa naipong emosyon, lalo na kung dulot ng mga hindi inaasahang pangyayari, at na[...] | Filipino word: simbuyo | Student selected: nilalakbay | Correct answer: silakbo",
            "context_type": "vocabulary"
        }
    },
    {
        "id": "vocab_003",
        "exercise_type": "quiz",
        "correct_answer": "siyasat",
        "student_answer": "dalampasigan",
        "contexts": [
            "[COMMON MISTAKE] Mechanics Errors in Filipino Essays: Errors in writing mechanics including spelling, punctuation, capitalization, and word breaks.",
            "[COMMON MISTAKE] Spelling and Word Merging Errors: Errors involving spelling mistakes or incorrectly merged words.",
            "[VOCABULARY] bulay: Ang malalim na pagsusuri o pag-iisip tungkol sa isang bagay.",
            "[VOCABULARY] gimbal: Matinding pagkabigla o pagkagitla dahil sa nakapanlulumong o nakakatakot na pangyayari."
        ],
        "answer": "1. Ang \"siyasat\" ang tamang sagot dahil ito ang kahulugan ng salitang \"susog\", na tumutukoy sa pagbabago o pagdaragdag sa isang batas, panukala, o dokumento. Ito ay sumusunod sa opisyal na kahulugan ng salita, kaya't ito ang wastong pagpili.\n\n2. Ang napiling sagot na \"dalampasigan\" ay mali dahil ito ay hindi sumusunod sa opisyal na kahulugan ng salitang \"susog\", at ito ay isang halimbawa ng spelling and word merging error, isang karaniwang pagkakamali na nakatala sa mga common mistake patterns, kung saan ang isang salita ay hindi wastong binaybay o ginamit.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 4,
            "sources": [
                "mistakes",
                "vocabulary"
            ],
            "avg_relevance": 0.7886395863651915,
            "query": "Filipino word: susog. Definition: Ang pagbabago o pagdaragdag sa isang batas, panukala, o dokumento. | Filipino word: susog | Student selected: dalampasigan | Correct answer: siyasat",
            "context_type": "vocabulary"
        }
    },
    {
        "id": "vocab_004",
        "exercise_type": "quiz",
        "correct_answer": "matindi",
        "student_answer": "kariktan",
        "contexts": [
            "[COMMON MISTAKE] Ng vs. Nang misuse: Confusion between the Filipino function words 'ng' and 'nang', often misused in place of one another.",
            "[COMMON MISTAKE] Ligature and Function Word Errors: Errors involving ligatures and function words such as 'na', '-ng', and misuse of 'nang' vs 'ng'.",
            "[VOCABULARY] puyos: Matinding pag-aalab ng damdamin, lalo na ng galit o hinanakit.",
            "[VOCABULARY] hutukin: Pagbaluktot, paghubog, o pag-akay sa isang bagay o tao patungo sa isang partikular na direksiyon o anyo."
        ],
        "answer": "1. Ang \"matindi\" ang tamang sagot dahil ito ang kahulugan ng salitang \"silakbo\" na tumutukoy sa biglaang paglabas o pagbulas ng matinding damdamin, katulad ng galit o hinanakit. Ito ay isang direktang paglalarawan ng emosyon na inilalarawan ng salita.\n\n2. Ang \"kariktan\" ay mali dahil ito ay hindi tumutukoy sa kahulugan ng salitang \"silakbo\" at wala sa mga kasingkahulugan nito, tulad ng \"matinding-galit\", \"pagkamuhi\", \"silakbo\", at \"ngitngit\". Hindi ito isang common mistake pattern na nakalista sa mga reference materials, ngunit ito ay maaaring sanhi ng pagkakamali sa pag-unawa o paggamit ng mga salita.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 4,
            "sources": [
                "mistakes",
                "vocabulary"
            ],
            "avg_relevance": 0.8774323816364574,
            "query": "Filipino word: silakbo. Definition: Ang biglaang paglabas o pagbulas ng matinding damdamin. | Filipino word: silakbo | Student selected: kariktan | Correct answer: matindi",
            "context_type": "vocabulary"
        }
    },
    {
        "id": "vocab_005",
        "exercise_type": "quiz",
        "correct_answer": "pagluha",
        "student_answer": "maalab",
        "contexts": [
            "[COMMON MISTAKE] Ligature and Function Word Errors: Errors involving ligatures and function words such as 'na', '-ng', and misuse of 'nang' vs 'ng'.",
            "[COMMON MISTAKE] Ng vs. Nang misuse: Confusion between the Filipino function words 'ng' and 'nang', often misused in place of one another.",
            "[VOCABULARY] tangis: Ang malalim at masidhing pag-iyak na madalas ay dulot ng matinding pait o lungkot.",
            "[VOCABULARY] bulay: Ang malalim na pagsusuri o pag-iisip tungkol sa isang bagay."
        ],
        "answer": "1. Ang \"pagluha\" ay tamang sagot dahil ito ay isa sa mga kasingkahulugan ng \"pagtangis\" ayon sa nabanggit na reference material, kung saan nakalista ang \"pagluha\" bilang isa sa mga salitang may katulad na kahulugan. Ito ay nangangahulugang malalim at masidhing pag-iyak, na katulad ng kahulugan ng \"pagtangis\".\n\n2. Ang \"maalab\" ay mali dahil hindi ito nakalista bilang kasingkahulugan ng \"pagtangis\" sa reference material, at hindi rin ito sumasagot sa tanong tungkol sa kahulugan ng \"pagtangis\". Hindi rin ito isang karaniwang pagkakamali na nakalista sa mga common mistake patterns, ngunit ito ay maaaring sanhi ng pagkakamali sa pag-unawa ng kahulugan ng salita.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 4,
            "sources": [
                "mistakes",
                "vocabulary"
            ],
            "avg_relevance": 0.8985808104976856,
            "query": "Filipino word: pagtangis. Definition: Ang malalim at masidhing pag-iyak na madalas ay dulot ng matinding pait o lungkot. | Filipino word: pagtangis | Student selected: maalab | Correct answer: pagluha",
            "context_type": "vocabulary"
        }
    },
    {
        "id": "vocab_006",
        "exercise_type": "antonym",
        "correct_answer": "nagwaldas",
        "student_answer": "humpay",
        "contexts": [
            "[COMMON MISTAKE] Ng vs. Nang misuse: Confusion between the Filipino function words 'ng' and 'nang', often misused in place of one another.",
            "[COMMON MISTAKE] Ligature and Function Word Errors: Errors involving ligatures and function words such as 'na', '-ng', and misuse of 'nang' vs 'ng'.",
            "[VOCABULARY] kamal: Pag-iipon o pagkalap ng maraming bagay, lalo na ng kayamanan o ari-arian.",
            "[VOCABULARY] gimbal: Matinding pagkabigla o pagkagitla dahil sa nakapanlulumong o nakakatakot na pangyayari."
        ],
        "answer": "1. Ang \"nagwaldas\" ay tamang kasalungat ng \"nagkamal\" dahil ang \"nagkamal\" ay tumutukoy sa pag-iipon o pagkalap ng maraming bagay, lalo na ng kayamanan o ari-arian, samantala ang \"nagwaldas\" ay nangangahulugang paggasta o pagtapon ng mga bagay, partikular na ang yaman.\n\n2. Ang \"humpay\" ay mali dahil ito ay hindi kasalungat ng \"nagkamal\". Sa katunayan, walang ibinigay na kahulugan para sa \"humpay\" sa mga reference materials, at ang \"nagkamal\" ay may kasalungat na \"nagwaldas\", \"ubusin\", o \"magpakawala\" ayon sa mga binigay na impormasyon.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 4,
            "sources": [
                "mistakes",
                "vocabulary"
            ],
            "avg_relevance": 0.8833986506803869,
            "query": "Filipino word: nagkamal. Definition: Pag-iipon o pagkalap ng maraming bagay, lalo na ng kayamanan o ari-arian. | Filipino word: nagkamal | Student selected: humpay | Correct answer: nagwaldas",
            "context_type": "vocabulary"
        }
    },
    {
        "id": "vocab_007",
        "exercise_type": "antonym",
        "correct_answer": "kapinsalan",
        "student_answer": "ilanlang",
        "contexts": [
            "[VOCABULARY] biyaya: Kaloob o pagpapalang tinatanggap nang walang hinihinging kapalit, kadalasan mula sa Diyos o kapalaran.",
            "[COMMON MISTAKE] Ng vs. Nang misuse: Confusion between the Filipino function words 'ng' and 'nang', often misused in place of one another.",
            "[COMMON MISTAKE] Ligature and Function Word Errors: Errors involving ligatures and function words such as 'na', '-ng', and misuse of 'nang' vs 'ng'."
        ],
        "answer": "1. Ang \"kapinsalan\" ay tamang kasalungat ng \"biyaya\" dahil ito ay tumutukoy sa isang bagay na hindi kanais-nais o nakakasama, na kabaligtaran ng kahulugan ng \"biyaya\" na isang kaloob o pagpapalang tinatanggap nang walang hinihinging kapalit.\n\n2. Mali ang napiling sagot na \"ilanlang\" dahil ito ay hindi kasalungat ng \"biyaya\". Sa halip, ang \"kapinsalan\" ang tamang kasalungat ng \"biyaya\" ayon sa nabanggit na reference material.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 3,
            "sources": [
                "mistakes",
                "vocabulary"
            ],
            "avg_relevance": 1.0,
            "query": "Filipino word: biyaya. Definition: Kaloob o pagpapalang tinatanggap nang walang hinihinging kapalit, kadalasan mula sa Diyos o kapalaran. | Filipino word: biyaya | Student selected: ilanlang | Correct answer: kapinsalan",
            "context_type": "vocabulary"
        }
    },
    {
        "id": "vocab_008",
        "exercise_type": "antonym",
        "correct_answer": "sumuway",
        "student_answer": "tuyot",
        "contexts": [
            "[COMMON MISTAKE] Ligature and Function Word Errors: Errors involving ligatures and function words such as 'na', '-ng', and misuse of 'nang' vs 'ng'.",
            "[COMMON MISTAKE] Incorrect Affix Spacing (pa + na): Incorrect joining of 'pa' + 'na' forms into one unit, e.g., 'palang', 'parin' instead of correct separate forms.",
            "[VOCABULARY] bulay: Ang malalim na pagsusuri o pag-iisip tungkol sa isang bagay.",
            "[VOCABULARY] gimbal: Matinding pagkabigla o pagkagitla dahil sa nakapanlulumong o nakakatakot na pangyayari."
        ],
        "answer": "1. Ang \"sumuway\" ay tamang kasalungat ng \"pagtalima\" dahil ang \"sumuway\" ay nangangahulugang hindi pagsunod o paglabag sa isang utos o tagubilin, samantalang ang \"pagtalima\" ay nangangahulugang matapat na pagsunod sa isang utos o tagubilin.\n\n2. Mali ang napiling sagot na \"tuyot\" dahil ito ay hindi kasalungat ng \"pagtalima\". Ang \"tuyot\" ay isang salitang may ibang kahulugan at hindi ito direktang kaugnay ng konsepto ng pagsunod o paglabag sa isang utos o tagubilin.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 4,
            "sources": [
                "mistakes",
                "vocabulary"
            ],
            "avg_relevance": 0.8191036339566689,
            "query": "Filipino word: pagtalima. Definition: Ang matapat na pagsunod sa isang utos o tagubilin. | Filipino word: pagtalima | Student selected: tuyot | Correct answer: sumuway",
            "context_type": "vocabulary"
        }
    },
    {
        "id": "vocab_009",
        "exercise_type": "antonym",
        "correct_answer": "kapangitan",
        "student_answer": "marubdob",
        "contexts": [
            "[VOCABULARY] alindog: Likas na ganda o kaakit-akit na anyo, kilos, o dating ng isang tao o bagay.",
            "[COMMON MISTAKE] Ligature and Function Word Errors: Errors involving ligatures and function words such as 'na', '-ng', and misuse of 'nang' vs 'ng'."
        ],
        "answer": "1. Ang \"kapangitan\" ang tamang kasalungat ng \"alindog\" dahil ito ay tumutukoy sa kawalan ng likas na ganda o kaakit-akit na anyo, kilos, o dating ng isang tao o bagay. Ito ay direktang kontrasto sa kahulugan ng \"alindog\".\n\n2. Ang \"marubdob\" ay mali bilang kasalungat ng \"alindog\" dahil ito ay may kahulugan na malakas o matapang, na hindi direktang kontrasto sa kahulugan ng \"alindog\". Hindi ito isang antonym ng \"alindog\", kundi posibleng isang hiwalay na katangian.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 2,
            "sources": [
                "mistakes",
                "vocabulary"
            ],
            "avg_relevance": 1.0,
            "query": "Filipino word: alindog. Definition: Likas na ganda o kaakit-akit na anyo, kilos, o dating ng isang tao o bagay. | Filipino word: alindog | Student selected: marubdob | Correct answer: kapangitan",
            "context_type": "vocabulary"
        }
    },
    {
        "id": "vocab_010",
        "exercise_type": "antonym",
        "correct_answer": "kalmado",
        "student_answer": "hiyas",
        "contexts": [
            "[COMMON MISTAKE] Ng vs. Nang misuse: Confusion between the Filipino function words 'ng' and 'nang', often misused in place of one another.",
            "[COMMON MISTAKE] Ligature and Function Word Errors: Errors involving ligatures and function words such as 'na', '-ng', and misuse of 'nang' vs 'ng'.",
            "[VOCABULARY] balisa: Kalagayan ng pagkabalisa o hindi mapakali dahil sa pag-aalala o tensiyon.",
            "[VOCABULARY] nabinbin: Paghinto o pagkaantala ng isang bagay na dapat nang naganap o natapos."
        ],
        "answer": "1. Ang \"kalmado\" ang tamang kasalungat ng \"nabalisa\" dahil ito ay sumasagot sa kabaligtaran ng kahulugan ng \"nabalisa\", na kalagayan ng pagkabalisa o hindi mapakali. Ang \"kalmado\" ay nangangahulugang may kapayapaan at katiwasayan, kabaligtad sa pagkabalisa.\n\n2. Mali ang napiling sagot na \"hiyas\" dahil ito ay hindi kasalungat ng \"nabalisa\". Ang \"hiyas\" ay nangangahulugang kagandahan o karangalan, at hindi ito may kaugnayan sa kahulugan ng \"nabalisa\" na pagkabalisa o tensiyon. Sa halip, ang \"kalmado\" ang tamang kasalungat ng \"nabalisa\" ayon sa mga ibinigay na reference materials.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 4,
            "sources": [
                "mistakes",
                "vocabulary"
            ],
            "avg_relevance": 0.8548234827219959,
            "query": "Filipino word: nabalisa. Definition: Kalagayan ng pagkabalisa o hindi mapakali dahil sa pag-aalala o tensiyon. | Filipino word: nabalisa | Student selected: hiyas | Correct answer: kalmado",
            "context_type": "vocabulary"
        }
    }
]
