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
        "id": "gram_001",
        "exercise_type": "error-identification",
        "correct_answer": "Walang Mali",
        "student_answer": "buhay ay",
        "contexts": [
            "[GRAMMAR] Pagtangi at Pagtatanong (Hedging and Questioning): Softening expressions and indirect question forms.",
            "[GRAMMAR] Pagtatambal (Compounding): Combining two or more words to create new words."
        ],
        "answer": "Ang pangungusap ay walang malinaw na pagkakabanggit kaya't hindi natin masabi kung may error o wala. Kung ang pangungusap ay may kahulugan na malinaw at sumusunod sa mga tuntunin ng pagtangi at pagtatanong o pagtatambal, maari itong ituring na walang mali. Ang pagpili ng estudyante na \"buhay ay\" ay hindi malinaw kung saang bahagi ng pangungusap ito umiiral, kaya't hindi natin masabi kung ito ang tamang pagpili. Kailangan ng karagdagang impormasyon upang masabi kung may error o wala sa pangungusap at kung bakit ang pagpili ng estudyante ay tama o mali.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 2,
            "sources": [
                "grammar"
            ],
            "avg_relevance": 0.9098900699509258,
            "query": "Filipino grammar: . Word: Walang Mali salita: Walang Mali maling sagot: buhay ay tamang sagot: Walang Mali gramatika balarila pangungusap",
            "context_type": "grammar"
        }
    },
    {
        "id": "gram_002",
        "exercise_type": "error-identification",
        "correct_answer": "hikahos kalagayan",
        "student_answer": "nabubuhay sa",
        "contexts": [
            "[GRAMMAR] Pagtatambal (Compounding): Combining two or more words to create new words.",
            "[GRAMMAR] Pagpapaikli (Clipping/Abbreviation): Shortening words while retaining meaning, common in informal Filipino."
        ],
        "answer": "Ang pangungusap na may error ay \"hikahos kalagayan\" dahil ito ay dapat \"hikahos na kalagayan\" ayon sa pagtatambal o compounding. Ito ay lumabag sa rule ng pagtatambal kung saan dapat magkaroon ng hyphen (-) sa pagitan ng mga salitang pinagsasama upang bumuo ng isang bagong salita. Ang napili ng estudyante na \"nabubuhay sa\" ay hindi angkop na pagsasalin o pagpapalit sa salitang may error. Kaya, ang tamang pagsusuri ay may error ang pangungusap dahil sa mali o kulang na paggamit ng pagtatambal.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 2,
            "sources": [
                "grammar"
            ],
            "avg_relevance": 0.8273067050237666,
            "query": "Filipino grammar: . Word: hikahos kalagayan salita: hikahos kalagayan maling sagot: nabubuhay sa tamang sagot: hikahos kalagayan gramatika balarila pangungusap",
            "context_type": "grammar"
        }
    },
    {
        "id": "gram_003",
        "exercise_type": "error-identification",
        "correct_answer": "binalibag",
        "student_answer": "Walang Mali",
        "contexts": [
            "[GRAMMAR] Pagtatambal (Compounding): Combining two or more words to create new words.",
            "[GRAMMAR] Pagpapaikli (Clipping/Abbreviation): Shortening words while retaining meaning, common in informal Filipino."
        ],
        "answer": "Ang pangungusap na \"binalibag\" ay may posibleng error sa pagtatambal o compounding. Ayon sa mga panuntunan, ang tamang pagsasama ng mga salita ay dapat sundin, halimbawa, \"araw + gabi\" ay naging \"araw-gabi\". Sa kasong ito, ang \"binalibag\" ay maaaring hindi sumusunod sa tamang pagsasama ng mga salita, kaya't ang pagpili ng estudyante na \"Walang Mali\" ay maaaring hindi tama. Kailangan ng mas malalim na pagsusuri upang matukoy kung ang \"binalibag\" ay talagang may error o hindi, ngunit sa una, ito ay tila may posibleng paglabag sa pagtatambal.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 2,
            "sources": [
                "grammar"
            ],
            "avg_relevance": 0.807474707400953,
            "query": "Filipino grammar: . Word: binalibag salita: binalibag maling sagot: Walang Mali tamang sagot: binalibag gramatika balarila pangungusap",
            "context_type": "grammar"
        }
    },
    {
        "id": "gram_004",
        "exercise_type": "error-identification",
        "correct_answer": "Walang Mali",
        "student_answer": "sa social",
        "contexts": [
            "[GRAMMAR] Pagtangi at Pagtatanong (Hedging and Questioning): Softening expressions and indirect question forms.",
            "[GRAMMAR] Pagtatambal (Compounding): Combining two or more words to create new words."
        ],
        "answer": "Ang pangungusap na \"Walang Mali\" ay walang error sa pagtatambal o pagtangi at pagtatanong, kaya't ang sagot ng estudyante ay tama. Ito ay dahil walang mga salitang pinagsasama o pinag-uusig upang makabuo ng bagong salita, at walang mga ekspresyon na nagpapahina o nagtatanong na kinakailangan. Ang pagpili ng estudyante sa \"sa social\" ay hindi umiiral sa pangungusap, kaya't hindi ito angkop na sagot. Sa kabuuan, ang pangungusap ay simple at walang error, kaya't ang sagot ng estudyante ay wasto.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 2,
            "sources": [
                "grammar"
            ],
            "avg_relevance": 0.9044547284682853,
            "query": "Filipino grammar: . Word: Walang Mali salita: Walang Mali maling sagot: sa social tamang sagot: Walang Mali gramatika balarila pangungusap",
            "context_type": "grammar"
        }
    },
    {
        "id": "gram_005",
        "exercise_type": "error-identification",
        "correct_answer": "matingkad na kulay",
        "student_answer": "Walang Mali",
        "contexts": [
            "[GRAMMAR] Pagtatambal (Compounding): Combining two or more words to create new words.",
            "[GRAMMAR] Pagpapaikli (Clipping/Abbreviation): Shortening words while retaining meaning, common in informal Filipino."
        ],
        "answer": "Ang pangungusap na \"matingkad na kulay\" ay walang error sa pagtatambal o pagpapaikli ng salita. Ito ay isang tamang paggamit ng mga salita sa Filipino, kaya't ang pagpili ng estudyante na \"Walang Mali\" ay tama. Hindi mayroong paglabag sa mga tuntunin ng pagtatambal o pagpapaikli ng salita, at ang paggamit ng mga salita ay ayon sa wastong pagbubuo ng salita. Kaya, ang pagpili ng estudyante ay wasto at hindi mayroong anumang error sa pangungusap.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 2,
            "sources": [
                "grammar"
            ],
            "avg_relevance": 0.8297296940072263,
            "query": "Filipino grammar: . Word: matingkad na kulay salita: matingkad na kulay maling sagot: Walang Mali tamang sagot: matingkad na kulay gramatika balarila pangungusap",
            "context_type": "grammar"
        }
    },
    {
        "id": "gram_006",
        "exercise_type": "fill-blanks",
        "correct_answer": "pagbabaklas",
        "student_answer": "baklasin",
        "contexts": [
            "[GRAMMAR] Pagtatambal (Compounding): Combining two or more words to create new words.",
            "[GRAMMAR] Basic Word Order: Typical Filipino sentences are predicate-first (Verb-Subject-Object) though other orders are grammatically possible."
        ],
        "answer": "Ang \"pagbabaklas\" ang tamang salita dahil ito ay sumusunod sa pagtatambal o compounding, kung saan pinagsasama ang mga salita upang bumuo ng isang bagong salita. Ayon sa mga panuntunan ng pagtatambal, ang \"pagbabaklas\" ay isang tamang halimbawa nito, kung saan ang \"baklas\" ay pinagbabase sa salitang \"baklas\" at ang panlapi \"pagba-\" ay idinagdag upang mabuo ang salitang \"pagbabaklas\". Ang estudyante ay nagkamali nang pumili ng \"baklasin\" dahil ito ay sumusunod sa isang ibang anyo ng pagbubuo ng salita, at hindi sa pagtatambal. Dahil dito, ang \"baklasin\" ay hindi ang tamang salita sa konteksto ng tanong.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 2,
            "sources": [
                "grammar"
            ],
            "avg_relevance": 0.8245175917286246,
            "query": "Filipino grammar: . Word: pagbabaklas salita: pagbabaklas maling sagot: baklasin tamang sagot: pagbabaklas gramatika balarila pangungusap",
            "context_type": "grammar"
        }
    },
    {
        "id": "gram_007",
        "exercise_type": "fill-blanks",
        "correct_answer": "mabagabag",
        "student_answer": "bagabag",
        "contexts": [
            "[GRAMMAR] Pagtatambal (Compounding): Combining two or more words to create new words.",
            "[GRAMMAR] Basic Word Order: Typical Filipino sentences are predicate-first (Verb-Subject-Object) though other orders are grammatically possible."
        ],
        "answer": "Ang \"mabagabag\" ang tamang salita dahil ito ay isang salitang inayos sa pamamagitan ng pagtatambal ng mga salita, na sumusunod sa pagtatambal o compounding. Ayon sa mga panuntunan ng pagbubuo ng salita, ang \"mabagabag\" ay sumusunod sa tamang pag-iisa ng mga salita, kung saan hindi ginamit ang mali o di-tamang pagbubuo ng salita. Ang estudyante ay nagkamali sa pagpili ng \"bagabag\" dahil hindi ito sumusunod sa tamang pagbubuo ng salita, na isang karaniwang pagkakamali sa pagbubuo ng mga salita. Sa gayon, ang \"mabagabag\" ang tamang salita dahil sumusunod ito sa mga panuntunan ng pagbubuo ng salita at pagtatambal.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 2,
            "sources": [
                "grammar"
            ],
            "avg_relevance": 0.8256804417440289,
            "query": "Filipino grammar: . Word: mabagabag salita: mabagabag maling sagot: bagabag tamang sagot: mabagabag gramatika balarila pangungusap",
            "context_type": "grammar"
        }
    },
    {
        "id": "gram_008",
        "exercise_type": "fill-blanks",
        "correct_answer": "kahapuan",
        "student_answer": "nahahapo",
        "contexts": [
            "[GRAMMAR] Pagtatambal (Compounding): Combining two or more words to create new words.",
            "[GRAMMAR] Basic Word Order: Typical Filipino sentences are predicate-first (Verb-Subject-Object) though other orders are grammatically possible."
        ],
        "answer": "Ang \"kahapuan\" ang tamang salita dahil ito ang wastong termino para sa \"matinding pagod ng katawan o isipan matapos ang isang mabigat na gawain\". Ayon sa pagtatambal (compounding), ang \"kahapuan\" ay nabuo mula sa pagbubuo ng salita, kung saan ang mga komponente ay pinagsasama upang makalikha ng isang bagong salita. Ang estudyante ay nagkamali sa pagpili ng \"nahahapo\" dahil hindi ito sumusunod sa tamang pagbubuo ng salita, at ito ay isang halimbawa ng common error sa pagtatambal. Dahil dito, ang \"kahapuan\" ang mas wastong paggamit ng salita sa pangungusap.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 2,
            "sources": [
                "grammar"
            ],
            "avg_relevance": 0.8230114757091371,
            "query": "Filipino grammar: . Word: kahapuan salita: kahapuan maling sagot: nahahapo tamang sagot: kahapuan gramatika balarila pangungusap",
            "context_type": "grammar"
        }
    },
    {
        "id": "gram_009",
        "exercise_type": "fill-blanks",
        "correct_answer": "apuhapin",
        "student_answer": "inaapuhap",
        "contexts": [
            "[GRAMMAR] Pagtatambal (Compounding): Combining two or more words to create new words.",
            "[GRAMMAR] Pagpapaikli (Clipping/Abbreviation): Shortening words while retaining meaning, common in informal Filipino."
        ],
        "answer": "Ang \"apuhapin\" ang tamang salita dahil ito ang wastong pagtatambal ng mga salita upang bumuo ng isang bagong salita. Ayon sa pagtatambal (compounding) na nakasaad sa mga panuntunan ng balarila, ito ay nangyayari kapag pinagsasama ang dalawang o higit pang salita upang makabuo ng isang bagong salita. Hindi ginamit ng estudyante ang tamang pagtatambal, kaya mali ang kanyang napiling sagot na \"inaapuhap\", na nagpapakita ng isang karaniwang pagkakamali sa pagbubuo ng salita. Sa kasong ito, ang estudyante ay dapat gumamit ng wastong pagtatambal upang makabuo ng salitang \"apuhapin\".",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 2,
            "sources": [
                "grammar"
            ],
            "avg_relevance": 0.8321665305068522,
            "query": "Filipino grammar: . Word: apuhapin salita: apuhapin maling sagot: inaapuhap tamang sagot: apuhapin gramatika balarila pangungusap",
            "context_type": "grammar"
        }
    },
    {
        "id": "gram_010",
        "exercise_type": "fill-blanks",
        "correct_answer": "nabiyayaan",
        "student_answer": "mabiyaya",
        "contexts": [
            "[GRAMMAR] Pagtatambal (Compounding): Combining two or more words to create new words.",
            "[GRAMMAR] Pagpapaikli (Clipping/Abbreviation): Shortening words while retaining meaning, common in informal Filipino."
        ],
        "answer": "Ang \"nabiyayaan\" ang tamang salita dahil ito ang nasa anyo ng pandiwa na may kahulugan ng pagtanggap ng biyaya. Ayon sa mga panuntunan ng pagbubuo ng salita, ito ay sumusunod sa mga karaniwang anyo ng pandiwa sa Filipino. Ang estudyante ay nagkamali nang pumili ng \"mabiyaya\" dahil hindi ito sumusunod sa tamang anyo ng pandiwa, at hindi rin ito isang halimbawa ng pagtatambal o pagpapaikli ng salita. Sa halip, ang \"nabiyayaan\" ay isang halimbawa ng pagbubuo ng salita sa pamamagitan ng pagdaragdag ng panlapi sa salitang-ugat na \"biyaya\".",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 2,
            "sources": [
                "grammar"
            ],
            "avg_relevance": 0.8344704450419458,
            "query": "Filipino grammar: . Word: nabiyayaan salita: nabiyayaan maling sagot: mabiyaya tamang sagot: nabiyayaan gramatika balarila pangungusap",
            "context_type": "grammar"
        }
    },
    {
        "id": "sc_001",
        "exercise_type": "sentence-ordering",
        "correct_answer": "Ang kaliluhan ng kanyang kaibigan ay nagdulot ng matinding sakit.",
        "student_answer": "matinding sakit. Ang kanyang ng ay ng nagdulot kaliluhan kaibigan",
        "contexts": [
            "[GRAMMAR] Basic Word Order: Typical Filipino sentences are predicate-first (Verb-Subject-Object) though other orders are grammatically possible.",
            "[GRAMMAR] Verb–Subject–Object Order: In Filipino, the verb typically comes before the subject and object, unlike English’s subject–verb–object order.",
            "[GRAMMAR] Sentence Structure: Tagalog word order differs from English; subject marking via particle markers (e.g., ang).",
            "[VOCABULARY] kaliluhan: Matinding pagtataksil o kawalang-katapatan sa tiwala o tungkulin."
        ],
        "answer": "Ang \"Ang kaliluhan ng kanyang kaibigan ay nagdulot ng matinding sakit\" ay ang tamang pagkakasunod-sunod ng mga salita dahil ito ay sumusunod sa verb-subject-object order at nagagamit ang particle marker \"ang\" para sa subject marking. Ang pagkakasunod-sunod ng estudyante ay mali dahil hindi ito sumusunod sa tamang word order at nagdudulot ng kabagalan sa pag-unawa. Dapat sundin ang mga grammar rules tulad ng verb-subject-object order at sentence structure na nagagamit ng particle markers para sa tamang pagbuo ng pangungusap.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 4,
            "sources": [
                "grammar",
                "vocabulary"
            ],
            "avg_relevance": 0.8142237238412087,
            "query": "Filipino sentence ordering: Correct: Ang kaliluhan ng kanyang kaibigan ay nagdulot ng matinding sakit. pangungusap: Ang kaliluhan ng kanyang kaibigan ay nagdulot ng matinding sakit. maling sagot: matinding sakit. Ang kanyang ng ay ng nagdulot kaliluhan kaibigan tamang sagot: Ang kaliluhan ng kanyang kaibigan ay nagdulot ng matinding sakit. pagkakasunod-sunod ayos pangungusap",
            "context_type": "sentence-ordering"
        }
    },
    {
        "id": "sc_002",
        "exercise_type": "sentence-ordering",
        "correct_answer": "Walang humpay ang ulan buong maghapon.",
        "student_answer": "Walang ulan humpay ang buong maghapon.",
        "contexts": [
            "[GRAMMAR] Basic Word Order: Typical Filipino sentences are predicate-first (Verb-Subject-Object) though other orders are grammatically possible.",
            "[GRAMMAR] Verb–Subject–Object Order: In Filipino, the verb typically comes before the subject and object, unlike English’s subject–verb–object order.",
            "[GRAMMAR] Sentence Structure: Tagalog word order differs from English; subject marking via particle markers (e.g., ang).",
            "[VOCABULARY] humpay: Pagpigil o pansamantalang pagtigil ng kilos o pangyayari."
        ],
        "answer": "Ang \"Walang humpay ang ulan buong maghapon\" ang tamang pagkakasunod-sunod ng mga salita dahil sinusunod nito ang verb-subject-object order ng Filipino, kung saan ang pangngalan (ulan) ay inilalagay pagkatapos ng pang-uri (walang humpay). Ang pagkakasunod-sunod ng estudyante, \"Walang ulan humpay ang buong maghapon\", ay mali dahil hindi ito sumusunod sa tamang pagkakasunod ng mga salita at nagpapahiwatig ng ibang kahulugan. Ayon sa mga grammar rules, dapat na manguna ang pang-uri (walang humpay) at susundan ng pangngalan (ulan) upang maipahayag ang tamang kahulugan.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 4,
            "sources": [
                "grammar",
                "vocabulary"
            ],
            "avg_relevance": 0.8142237238412087,
            "query": "Filipino sentence ordering: Correct: Walang humpay ang ulan buong maghapon. pangungusap: Walang humpay ang ulan buong maghapon. maling sagot: Walang ulan humpay ang buong maghapon. tamang sagot: Walang humpay ang ulan buong maghapon. pagkakasunod-sunod ayos pangungusap",
            "context_type": "sentence-ordering"
        }
    },
    {
        "id": "sc_003",
        "exercise_type": "sentence-ordering",
        "correct_answer": "Pinaniniwalaan ng ilan na may manggagaway sa kanilang baryo.",
        "student_answer": "Pinaniniwalaan ng kanilang manggagaway na may ilan sa baryo.",
        "contexts": [
            "[GRAMMAR] Basic Word Order: Typical Filipino sentences are predicate-first (Verb-Subject-Object) though other orders are grammatically possible.",
            "[GRAMMAR] Verb–Subject–Object Order: In Filipino, the verb typically comes before the subject and object, unlike English’s subject–verb–object order.",
            "[GRAMMAR] Sentence Structure: Tagalog word order differs from English; subject marking via particle markers (e.g., ang).",
            "[VOCABULARY] manggagaway: Taong pinaniniwalaang gumagamit ng mahika o kulam upang magdulot ng sakit o kapahamakan."
        ],
        "answer": "Ang \"Pinaniniwalaan ng ilan na may manggagaway sa kanilang baryo\" ang tamang pagkakasunod-sunod ng mga salita dahil sumusunod ito sa verb-subject-object order ng Filipino, kung saan ang verb (\"pinaniniwalaan\") ay nauuna sa subject (\"ng ilan\"). Ang pagkakasunod-sunod ng estudyante ay mali dahil nag-iiba ito sa tamang pagkakasunod ng salita, na dapat ay \"Pinaniniwalaan ng ilan\" ang nauuna. Sumusunod ito sa mga grammar rules tulad ng verb-subject-object order at sentence structure na inilalarawan sa mga pangungusap na may particle markers.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 4,
            "sources": [
                "grammar",
                "vocabulary"
            ],
            "avg_relevance": 0.8142237238412087,
            "query": "Filipino sentence ordering: Correct: Pinaniniwalaan ng ilan na may manggagaway sa kanilang baryo. pangungusap: Pinaniniwalaan ng ilan na may manggagaway sa kanilang baryo. maling sagot: Pinaniniwalaan ng kanilang manggagaway na may ilan sa baryo. tamang sagot: Pinaniniwalaan ng ilan na may manggagaway sa kanilang baryo. pagkakasunod-sunod ayos pangungusap",
            "context_type": "sentence-ordering"
        }
    },
    {
        "id": "sc_004",
        "exercise_type": "sentence-ordering",
        "correct_answer": "Hindi maikakaila ang kanyang sinta para sa taong matagal na niyang minamahal.",
        "student_answer": "Hindi matagal ang sinta maikakaila para niyang sa na taong kanyang minamahal.",
        "contexts": [
            "[GRAMMAR] Basic Word Order: Typical Filipino sentences are predicate-first (Verb-Subject-Object) though other orders are grammatically possible.",
            "[GRAMMAR] Verb–Subject–Object Order: In Filipino, the verb typically comes before the subject and object, unlike English’s subject–verb–object order.",
            "[GRAMMAR] Sentence Structure: Tagalog word order differs from English; subject marking via particle markers (e.g., ang)."
        ],
        "answer": "Ang tamang pagkakasunod-sunod na \"Hindi maikakaila ang kanyang sinta para sa taong matagal na niyang minamahal\" ay sumusunod sa verb-subject-object order at paggamit ng particle markers, kung saan ang verb (\"maikakaila\") ay nasa unahan. Ang pagkakasunod-sunod ng estudyante ay mali dahil hindi ito sumusunod sa tamang pagkakasunod ng mga salita at walang malinaw na paggamit ng particle markers. Dapat sundin ang mga grammar rules tulad ng predicate-first sentence structure at paggamit ng particle markers para sa tamang pagbuo ng pangungusap.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 3,
            "sources": [
                "grammar"
            ],
            "avg_relevance": 0.8689649651216116,
            "query": "Filipino sentence ordering: Correct: Hindi maikakaila ang kanyang sinta para sa taong matagal na niyang minamahal. pangungusap: Hindi maikakaila ang kanyang sinta para sa taong matagal na niyang minamahal. maling sagot: Hindi matagal ang sinta maikakaila para niyang sa na taong kanyang minamahal. tamang sagot: Hindi maikakaila ang kanyang sinta para sa taong matagal na niyang minamahal. pagkakasunod-sunod ayos pangungusap",
            "context_type": "sentence-ordering"
        }
    },
    {
        "id": "sc_005",
        "exercise_type": "sentence-ordering",
        "correct_answer": "Payak ang kanilang handa ngunit masaya ang salu-salo.",
        "student_answer": "Payak ang handa ngunit masaya ang kanilang salu-salo.",
        "contexts": [
            "[GRAMMAR] Basic Word Order: Typical Filipino sentences are predicate-first (Verb-Subject-Object) though other orders are grammatically possible.",
            "[GRAMMAR] Verb–Subject–Object Order: In Filipino, the verb typically comes before the subject and object, unlike English’s subject–verb–object order.",
            "[GRAMMAR] Sentence Structure: Tagalog word order differs from English; subject marking via particle markers (e.g., ang).",
            "[VOCABULARY] payak: Isang bagay na walang halong arte o kumplikadong detalye."
        ],
        "answer": "Ang tamang pagkakasunod-sunod na \"Payak ang kanilang handa ngunit masaya ang salu-salo\" ay sumusunod sa Verb-Subject-Object order at sentence structure ng Filipino, kung saan ang verb o pang-uri (payak, masaya) ay nauuna sa subject (handa, salu-salo). Ang pagkakasunod-sunod ng estudyante ay mali dahil hindi ito sumusunod sa tamang paggamit ng particle markers (ang, ng) at word order. Dapat sundin ang mga grammar rules tulad ng pagbuo ng pangungusap at sentence structure upang magkaroon ng tamang pagkakasunod-sunod ng mga salita.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 4,
            "sources": [
                "grammar",
                "vocabulary"
            ],
            "avg_relevance": 0.8142237238412087,
            "query": "Filipino sentence ordering: Correct: Payak ang kanilang handa ngunit masaya ang salu-salo. pangungusap: Payak ang kanilang handa ngunit masaya ang salu-salo. maling sagot: Payak ang handa ngunit masaya ang kanilang salu-salo. tamang sagot: Payak ang kanilang handa ngunit masaya ang salu-salo. pagkakasunod-sunod ayos pangungusap",
            "context_type": "sentence-ordering"
        }
    },
    {
        "id": "sc_006",
        "exercise_type": "choose-sentence",
        "correct_answer": "Nanlupaypay ang kanyang katawan matapos ang mahabang byahe.",
        "student_answer": "Bumukas ang kanyang katawan matapos ang mahabang byahe.",
        "contexts": [
            "[GRAMMAR] Use of *ay* Construction: The *ay* inversion creates emphasis or formality (*Si Juan ay guro*).",
            "[GRAMMAR] Kakulangan (Incomplete Construction): Missing essential elements in sentences."
        ],
        "answer": "Ang pangungusap na \"Nanlupaypay ang kanyang katawan matapos ang mahabang byahe\" ang pinakamainam na paggamit ng konteksto dahil ito ay naglalarawan ng pagod at kahinaan ng katawan. Hindi angkop ang \"Bumukas ang kanyang katawan\" dahil ito ay may ibang kahulugan at hindi nagpapakita ng pagod o kahinaan. Ang paggamit ng tamang salita at pagbuo ng pangungusap ay mahalaga upang maipahatid ang gusto mong kahulugan, at ito ay sumusunod sa mga prinsipyo ng sentence construction at context clues.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 2,
            "sources": [
                "grammar"
            ],
            "avg_relevance": 0.8255109482635214,
            "query": "Filipino sentence selection: Context: Halos hindi na siya makalakad dahil sa sobrang pagod.. Best: Nanlupaypay ang kanyang katawan matapos ang mahabang byahe. pangungusap: Halos hindi na siya makalakad dahil sa sobrang pagod. maling sagot: Bumukas ang kanyang katawan matapos ang mahabang byahe. tamang sagot: Nanlupaypay ang kanyang katawan matapos ang mahabang byahe. pumili pangungusap konteksto",
            "context_type": "choose-sentence"
        }
    },
    {
        "id": "sc_007",
        "exercise_type": "choose-sentence",
        "correct_answer": "Ang paglansag sa dating sistema ay kinakailangan para sa reporma.",
        "student_answer": "Ang pagpapanatili sa dating sistema ay kinakailangan para sa reporma.",
        "contexts": [
            "[GRAMMAR] Use of *ay* Construction: The *ay* inversion creates emphasis or formality (*Si Juan ay guro*).",
            "[GRAMMAR] Kakulangan (Incomplete Construction): Missing essential elements in sentences."
        ],
        "answer": "Ang \"Ang paglansag sa dating sistema ay kinakailangan para sa reporma\" ang pinakamainam na pangungusap para sa konteksto dahil ito ay malinaw na nagpapahayag ng ideya na kailangang alisin ang lumang istraktura para sa reporma. Hindi angkop ang napiling pangungusap ng estudyante dahil ito ay nagpapahayag ng kabaligtaran ng konteksto, at lumabag sa prinsipyo ng kompletong pangungusap. Ang paggamit ng salitang \"paglansag\" at \"kinakailangan\" ay sumusunod sa mga prinsipyo ng sentence construction at context clues, na nagpapakita ng kahalagahan ng reporma.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 2,
            "sources": [
                "grammar"
            ],
            "avg_relevance": 0.8255109482635214,
            "query": "Filipino sentence selection: Context: Kailangang alisin ang lumang istraktura para makapagtayo ng bago.. Best: Ang paglansag sa dating sistema ay kinakailangan para sa reporma. pangungusap: Kailangang alisin ang lumang istraktura para makapagtayo ng bago. maling sagot: Ang pagpapanatili sa dating sistema ay kinakailangan para sa reporma. tamang sagot: Ang paglansag sa dating sistema ay kinakailangan para sa reporma. pumili pangungusap konteksto",
            "context_type": "choose-sentence"
        }
    },
    {
        "id": "sc_008",
        "exercise_type": "choose-sentence",
        "correct_answer": "Naligwak ang kanyang pangarap dahil sa isang pagkakamali.",
        "student_answer": "Natupad ang kanyang pangarap dahil sa isang pagkakamali.",
        "contexts": [
            "[GRAMMAR] Use of *ay* Construction: The *ay* inversion creates emphasis or formality (*Si Juan ay guro*).",
            "[GRAMMAR] Kakulangan (Incomplete Construction): Missing essential elements in sentences."
        ],
        "answer": "Ang pangungusap na \"Naligwak ang kanyang pangarap dahil sa isang pagkakamali\" ang pinakamainam na paggamit dahil ito ay nagpapakita ng epekto ng pagkakamali sa pangarap ng indibidwal. Hindi angkop ang napiling pangungusap ng estudyante, \"Natupad ang kanyang pangarap dahil sa isang pagkakamali\", dahil ito ay nagpapahayag ng kabaligtaran ng inaasahan na kahulugan ayon sa konteksto. Ito ay sumusunod sa prinsipyo ng sentence construction na kung saan ang pagkakamali ay dapat magdulot ng negatibong resulta, tulad ng \"naligwak\" at hindi \"natupad\".",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 2,
            "sources": [
                "grammar"
            ],
            "avg_relevance": 0.8255109482635214,
            "query": "Filipino sentence selection: Context: Hindi siya nakapag-apply sa tamang oras dahil sa kapabayaan.. Best: Naligwak ang kanyang pangarap dahil sa isang pagkakamali. pangungusap: Hindi siya nakapag-apply sa tamang oras dahil sa kapabayaan. maling sagot: Natupad ang kanyang pangarap dahil sa isang pagkakamali. tamang sagot: Naligwak ang kanyang pangarap dahil sa isang pagkakamali. pumili pangungusap konteksto",
            "context_type": "choose-sentence"
        }
    },
    {
        "id": "sc_009",
        "exercise_type": "choose-sentence",
        "correct_answer": "Gimbal ang mga tao sa biglaang balita.",
        "student_answer": "Panatag ang mga tao sa biglaang balita.",
        "contexts": [
            "[GRAMMAR] Use of *ay* Construction: The *ay* inversion creates emphasis or formality (*Si Juan ay guro*).",
            "[GRAMMAR] Kakulangan (Incomplete Construction): Missing essential elements in sentences.",
            "[VOCABULARY] gimbal: Matinding pagkabigla o pagkagitla dahil sa nakapanlulumong o nakakatakot na pangyayari."
        ],
        "answer": "Ang \"Gimbal ang mga tao sa biglaang balita\" ang pinakamainam na pangungusap para sa konteksto dahil ito ay nagpapahayag ng matinding pagkabigla o pagkagitla na dulot ng nakapanlulumong insidente. Hindi angkop ang \"Panatag ang mga tao sa biglaang balita\" dahil ang salitang \"panatag\" ay isang antonym ng \"gimbal\" at hindi tugma sa konteksto ng isang nakapanlulumong insidente. Sa pagbuo ng pangungusap, mahalaga ang paggamit ng mga salita na tumutugma sa konteksto at emosyon na nais ipahayag, gaya ng paggamit ng salitang \"gimbal\" na may kahulugang matinding pagkabigla.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 3,
            "sources": [
                "grammar",
                "vocabulary"
            ],
            "avg_relevance": 0.7836739655090144,
            "query": "Filipino sentence selection: Context: May naganap na nakapanlulumong insidente.. Best: Gimbal ang mga tao sa biglaang balita. pangungusap: May naganap na nakapanlulumong insidente. maling sagot: Panatag ang mga tao sa biglaang balita. tamang sagot: Gimbal ang mga tao sa biglaang balita. pumili pangungusap konteksto",
            "context_type": "choose-sentence"
        }
    },
    {
        "id": "sc_010",
        "exercise_type": "choose-sentence",
        "correct_answer": "Ang agam-agam niya ay bunga ng kawalan ng malinaw na paliwanag.",
        "student_answer": "Ang alab niya ay bunga ng kawalan ng malinaw na paliwanag.",
        "contexts": [
            "[GRAMMAR] Use of *ay* Construction: The *ay* inversion creates emphasis or formality (*Si Juan ay guro*).",
            "[GRAMMAR] Kakulangan (Incomplete Construction): Missing essential elements in sentences.",
            "[VOCABULARY] agam-agam: Kalagayan ng pagdududa o kawalan ng katiyakan sa isang bagay, pasiya, o kinabukasan."
        ],
        "answer": "Ang pangungusap na \"Ang agam-agam niya ay bunga ng kawalan ng malinaw na paliwanag\" ang pinakamainam na paggamit sa konteksto dahil ito ay nagpapahayag ng kalagayan ng pagdududa o kawalan ng katiyakan, na tugma sa emosyong inilalarawan. Hindi angkop ang napiling pangungusap ng estudyante dahil \"alab\" ay may ibang kahulugan at hindi sumasagot sa konteksto ng pagdududa. Sa pagbuo ng pangungusap, mahalaga ang paggamit ng tamang mga salita at pagpapakita ng malinaw na diwa, tulad ng paggamit ng \"agam-agam\" sa lugar ng \"alab\".",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 3,
            "sources": [
                "grammar",
                "vocabulary"
            ],
            "avg_relevance": 0.7836739655090144,
            "query": "Filipino sentence selection: Context: Isang empleyado ang nagdadalawang-isip kung tatanggapin ang bagong tungkulin.. Best: Ang agam-agam niya ay bunga ng kawalan ng malinaw na paliwanag. pangungusap: Isang empleyado ang nagdadalawang-isip kung tatanggapin ang bagong tungkulin. maling sagot: Ang alab niya ay bunga ng kawalan ng malinaw na paliwanag. tamang sagot: Ang agam-agam niya ay bunga ng kawalan ng malinaw na paliwanag. pumili pangungusap konteksto",
            "context_type": "choose-sentence"
        }
    },
    {
        "id": "rec_001",
        "exercise_type": "reading-comprehension",
        "correct_answer": "Awa at dalamhati",
        "student_answer": "Galit at paghihiganti",
        "contexts": [
            "[VOCABULARY] balisbis: Pagdaloy o pag-agos nang mabilis at tuluy-tuloy, kadalasan para sa tubig o luha.",
            "[VOCABULARY] himakas: Ang huling mensahe o pamamaalam bago ang isang mahabang paghihiwalay o bago ang kamatayan.",
            "[GRAMMAR] Case Markers (Ang/Ng/Sa): Markers indicate grammatical roles such as subject focus, possession, and direction."
        ],
        "answer": "Ang \"Awa at dalamhati\" ang tamang sagot dahil walang paghihiganti o pagsisisi ang nais iparating ng manunulat, kundi isang emosyon na malamang nauugnay sa pagdadalamhati. Ang \"Galit at paghihiganti\" ay mali dahil hindi ito tumutugma sa tono at intensyon ng tula, na hindi naglalayong maghiganti o magpakita ng galit. Sa halip, ang tula ay nagpapakita ng isang mapagpakumbabang at malamlam na emosyon, na nagpapahayag ng awa at dalamhati.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 3,
            "sources": [
                "grammar",
                "vocabulary"
            ],
            "avg_relevance": 0.8774280044437707,
            "query": "Reading comprehension: Ano ang emosyong naghahari sa tula?. Passage:  salita: Ano ang emosyong naghahari sa tula? maling sagot: Galit at paghihiganti tamang sagot: Awa at dalamhati pagbasa pag-unawa teksto",
            "context_type": "reading-comprehension"
        }
    },
    {
        "id": "rec_002",
        "exercise_type": "reading-comprehension",
        "correct_answer": "depensa",
        "student_answer": "hadlang",
        "contexts": [
            "[VOCABULARY] haging: Isang pahayag na hindi direkta o pasaring upang magpahiwatig ng isang mensahe.",
            "[VOCABULARY] matimyas: Lubhang wagas, dalisay, at malalim, lalo na sa pag-ibig o damdamin.",
            "[GRAMMAR] Case Markers (Ang/Ng/Sa): Markers indicate grammatical roles such as subject focus, possession, and direction."
        ],
        "answer": "Ang \"depensa\" ang tamang sagot dahil ito ay tumutukoy sa isang bagay na nagbibigay-proteksiyon, gaya ng paggamit ng pahina ng diyaryo bilang panangga sa gutom at lamig. Hindi tamang sagot ang \"hadlang\" dahil ito ay may ibang konotasyon, na karaniwang tumutukoy sa isang bagay na nagdudulot ng sagabal o panganib. Sa konteksto ng paggamit ng salita, mahalaga na maunawaan ang diwa ng proteksiyon at pagtatanggol na ibinibigay ng salitang \"pananggalang\".",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 3,
            "sources": [
                "grammar",
                "vocabulary"
            ],
            "avg_relevance": 0.8750176639946788,
            "query": "Reading comprehension: Ano ang ibig sabihin ng salitang pananggalang ayon sa pagkakagamit sa teksto?. Passage:  salita: Ano ang ibig sabihin ng salitang pananggalang ayon sa pagkakagamit sa teksto? maling sagot: hadlang tamang sagot: depensa pagbasa pag-unawa teksto",
            "context_type": "reading-comprehension"
        }
    },
    {
        "id": "rec_003",
        "exercise_type": "reading-comprehension",
        "correct_answer": "makita ang mukha sa dyaryo",
        "student_answer": "pulso ng bata",
        "contexts": [
            "[VOCABULARY] ligwak: Pagkawala o pagkabigo ng isang pagkakataon o planong sana’y magtatagumpay; minsan ding tumutukoy sa pagtapon.",
            "[VOCABULARY] halaw: Kinuha o hinango mula sa ibang pinagmulan, gaya ng akda, ideya, o kuwento.",
            "[GRAMMAR] Case Markers (Ang/Ng/Sa): Markers indicate grammatical roles such as subject focus, possession, and direction."
        ],
        "answer": "Ang tamang sagot na \"makita ang mukha sa dyaryo\" ay tumutukoy sa pagkawala ng pagkakataon ng bata na makita ang sarili niyang larawan sa diyaryo, na ipinahiwatig ng manunulat bilang isang sayang. Ang napiling sagot na \"pulso ng bata\" ay mali dahil hindi ito tumutukoy sa pagkawala ng pagkakataon, kundi sa isang pisikal na bahagi ng katawan. Mahalaga na maunawaan ang konsepto ng \"sayang\" at \"nasayang\" sa konteksto ng tula upang makakuha ng tamang sagot.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 3,
            "sources": [
                "grammar",
                "vocabulary"
            ],
            "avg_relevance": 0.8680054297681576,
            "query": "Reading comprehension: Ano daw ang nasayang ayon sa manunulat?. Passage:  salita: Ano daw ang nasayang ayon sa manunulat? maling sagot: pulso ng bata tamang sagot: makita ang mukha sa dyaryo pagbasa pag-unawa teksto",
            "context_type": "reading-comprehension"
        }
    },
    {
        "id": "rec_004",
        "exercise_type": "reading-comprehension",
        "correct_answer": "barya",
        "student_answer": "bola",
        "contexts": [
            "[VOCABULARY] balisbis: Pagdaloy o pag-agos nang mabilis at tuluy-tuloy, kadalasan para sa tubig o luha.",
            "[GRAMMAR] Case Markers (Ang/Ng/Sa): Markers indicate grammatical roles such as subject focus, possession, and direction.",
            "[VOCABULARY] atupag: Maglaan ng oras o pagsisikap para sa isang gawain o tungkulin; pagtuunan ng pansin."
        ],
        "answer": "Ang \"barya\" ang tamang sagot dahil ito ay isang maliit na bagay na ginamit sa paghahambing sa ulo ng bata na \"gumulong\" matapos ang aksidente. Ang \"bola\" ay mali dahil hindi ito ang ginamit na paghambing sa ulo ng bata, at ang \"barya\" ay may partikular na kahulugan na nagpapaliwanag sa sitwasyon. Ang pagkakaibang ito ay mahalaga upang maunawaan ang konteksto ng paghahambing at ang mga salitang ginamit.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 3,
            "sources": [
                "grammar",
                "vocabulary"
            ],
            "avg_relevance": 0.8455639969371784,
            "query": "Reading comprehension: Ano ang sensilyo?. Passage:  salita: Ano ang sensilyo? maling sagot: bola tamang sagot: barya pagbasa pag-unawa teksto",
            "context_type": "reading-comprehension"
        }
    },
    {
        "id": "rec_005",
        "exercise_type": "reading-comprehension",
        "correct_answer": "Nagtatrabaho siya para sa kakarampot na pera",
        "student_answer": "Dahil para na itong makina na walang ibang alam kun'di ang magtrabaho",
        "contexts": [
            "[VOCABULARY] balisbis: Pagdaloy o pag-agos nang mabilis at tuluy-tuloy, kadalasan para sa tubig o luha.",
            "[GRAMMAR] Case Markers (Ang/Ng/Sa): Markers indicate grammatical roles such as subject focus, possession, and direction.",
            "[VOCABULARY] kaligkig: Panginginig ng katawan, lalo na dahil sa lamig o matinding pakiramdam."
        ],
        "answer": "Ang tamang sagot na \"Nagtatrabaho siya para sa kakarampot na pera\" ay nagsasabi ng katotohanan na ang buhay ng bata ay umiikot sa maliit na halaga ng pera, kaya't ang paghahambing sa ulo bilang sensilyo ay may saysay. Ang napiling sagot ng estudyante ay mali dahil hindi ito direktang nakatuon sa relasyon ng bata sa pera, kundi sa paghambing sa makina. Ang pag-intindi sa konsepto ng paghahambing at simbolismo ay mahalaga upang maunawaan ang paglalarawan sa ulo ng bata bilang sensilyo.",
        "ground_truth": "",
        "retrieval_metadata": {
            "total_chunks": 3,
            "sources": [
                "grammar",
                "vocabulary"
            ],
            "avg_relevance": 0.9002281632117689,
            "query": "Reading comprehension: Bakit sensilyo ang ginawang paglalarawan sa ulo ng bata?. Passage:  salita: Bakit sensilyo ang ginawang paglalarawan sa ulo ng bata? maling sagot: Dahil para na itong makina na walang ibang alam kun'di ang magtrabaho tamang sagot: Nagtatrabaho siya para sa kakarampot na pera pagbasa pag-unawa teksto",
            "context_type": "reading-comprehension"
        }
    }
]
