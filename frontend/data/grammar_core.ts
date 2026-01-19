export interface GrammarRule {
    rule_id: string;
    rule_name: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    topic: string;
    base_definition: string; // Tagalog explanation
    description: string; // English + Tagalog description
    example: string;
    explanation: string; // Detailed explanation in Tagalog
    related_concepts: string[]; // Related grammar rules/concepts
    common_mistakes: string[]; // Common errors learners make
}

export const grammarRulesData: GrammarRule[] = [
    {
        rule_id: "GRAM-001",
        rule_name: "Root Words and Affixes",
        difficulty: "Beginner",
        topic: "Fundamental Rules",
        base_definition: "Ang mga ugat at unlapi/suklapi na bumubuo sa salita upang magbago ng kahulugan at paggamit.",
        description: "Ang bawat salita ay binubuo ng ugat (root) at maaaring magdagdag ng unlapi (prefix) o suklapi (suffix) upang magbago ang kahulugan.",
        example: "Kita (see) → Nakikita (seeing) → Makikita (will see)",
        explanation: "Ang ugat na 'kita' ay nag-iiba depende sa prefix at suffix na idinagdag. Ang 'naki-' ay nagsasaad ng nakaraang aksyon, habang ang 'maki-' ay nagsasaad ng hinaharap.",
        related_concepts: ["Verb Affixes", "Noun Formation", "Adjective Modification"],
        common_mistakes: ["Combining incompatible affixes", "Incorrect vowel patterns"]
    },
    {
        rule_id: "GRAM-002",
        rule_name: "Sentence Structure",
        difficulty: "Beginner",
        topic: "Fundamental Rules",
        base_definition: "Ang pangunahing bahagi ng pangungusap at kung paano sila umaayos sa Tagalog.",
        description: "Ang pangungusap ay karaniwang nagsisimula sa pandiwa, karaniwang sumusunod ang paksa (subject) at tapos ang bagay (object). Ito ay kilala bilang Verb-Subject-Object (V-S-O) na kaayusan.",
        example: "Kumain ang bata ng bigas. (Ate the child rice.)",
        explanation: "Ang 'kumain' ay pandiwa, 'ang bata' ay paksa (ang + noun = nominative), at 'ng bigas' ay bagay (ng + noun = accusative).",
        related_concepts: ["Word Order", "Case Markers", "Declarative Sentences"],
        common_mistakes: ["Using English S-V-O word order", "Incorrect case markers"]
    },
    {
        rule_id: "GRAM-003",
        rule_name: "Pronunciation and Phonetics",
        difficulty: "Beginner",
        topic: "Fundamental Rules",
        base_definition: "Ang tamang paraan ng pagbigkas ng mga salitang Tagalog at ang tunog nito.",
        description: "Ang Tagalog ay may 16 na katinig at 5 na patinig. Ang bawat letra ay may katanging tunog, at walang tahimik na titik tulad sa Ingles.",
        example: "Mahal (love) - pronounced 'ma-HAL' with stress on second syllable",
        explanation: "Ang maraming Tagalog na salita ay may stress o diin sa tamang pantig. Ang 'mahal' ay ipinapahayag ng malakas ang ikalawang pantig.",
        related_concepts: ["Syllables", "Stress Patterns", "Diphthongs"],
        common_mistakes: ["Mispronouncing glottal stop (hamog)", "Wrong stress patterns"]
    },
    {
        rule_id: "GRAM-004",
        rule_name: "Syllable Repetition for Prolonged Action",
        difficulty: "Beginner",
        topic: "Fundamental Rules",
        base_definition: "Ang pagkukunuwari o paggalaw ng unang pantig ng salita upang ipakita na pangmatagalan ang aksyon.",
        description: "Sa Tagalog, ang pag-ulit ng unang pantig ng salita ay nagpapakita na ang aksyon ay patuloy o paulit-ulit.",
        example: "Tatakbo (will run once) vs. Tatatatakbo (will keep on running)",
        explanation: "Ang 'takbo' (run) ay nagiging 'tatakbo' (will run) sa future. Kung iuulit ang 'ta-', nagiging 'tatatatakbo' na nangangahulugang patuloy na pagtakbo.",
        related_concepts: ["Verb Aspects", "Iterative Action", "Continuative Aspect"],
        common_mistakes: ["Over-repetition", "Incorrect syllable selection for repetition"]
    },
    {
        rule_id: "GRAM-005",
        rule_name: "Case Markers (Particles)",
        difficulty: "Beginner",
        topic: "Fundamental Rules",
        base_definition: "Ang mga partikula na nagpapakita ng papel ng pangalan sa pangungusap.",
        description: "Ang Tagalog ay gumagamit ng mga partikula tulad ng 'ang', 'ng', 'sa', at 'para' upang ipakita kung ano ang paksa, bagay, lokasyon, o iba pang papel.",
        example: "Ang puno - nominative (subject), ng puno - genitive (possessive/object), sa puno - locative/dative",
        explanation: "Ang bawat marker ay may iba't ibang function. 'Ang' ay para sa mga paksa, 'ng' para sa mga bagay at ari-arian, at 'sa' para sa lokasyon at makatanggap.",
        related_concepts: ["Nominal Phrases", "Actor-Focus Verbs", "Patient-Focus Verbs"],
        common_mistakes: ["Mixing up 'ng' and 'ang'", "Incorrect particle for context"]
    },
    {
        rule_id: "GRAM-006",
        rule_name: "Gender Neutrality",
        difficulty: "Beginner",
        topic: "Nouns & Pronouns",
        base_definition: "Ang Tagalog ay walang sistema ng kasarian para sa mga pangalan, tulad ng 'he' at 'she' sa Ingles.",
        description: "Ang pangalang Tagalog ay walang gender distinction. Ang 'siya' ay ginagamit para sa lahat ng nangangahulugang 'he' o 'she'. Ito ay isa sa mga natatanging katangian ng Tagalog.",
        example: "Siya ay estudyante. (He/She is a student.) / Ang guro ay matalino. (The teacher is smart - no gender marker)",
        explanation: "Sa Tagalog, hindi mo kailangang ipakita kung lalaki o babae ang tao sa pamamagitan ng pronoun o noun. Ang konteksto lang ang magsasaad nito.",
        related_concepts: ["Pronouns", "Noun Phrases", "Inclusivity"],
        common_mistakes: ["Adding English-like gender markers", "Assuming gender from context"]
    },
    {
        rule_id: "GRAM-007",
        rule_name: "Plural Formation",
        difficulty: "Beginner",
        topic: "Nouns & Pronouns",
        base_definition: "Kung paano ginagawang marami ang mga salita sa Tagalog.",
        description: "Sa Tagalog, ang plural ay nabubuo sa pamamagitan ng pag-uulit ng unang pantig ng noun, hindi sa pamamagitan ng pagdagdag ng 's' tulad sa Ingles.",
        example: "Bata (child) → mga bata (children) / Bahay (house) → mga bahay (houses)",
        explanation: "Ang particle na 'mga' ay idinadalag bago ang noun upang ipakita ang plural. Ang salita mismo ay maaaring umulit o manatiling pareho depende sa uri.",
        related_concepts: ["Count Nouns", "Mass Nouns", "Collective Nouns"],
        common_mistakes: ["Overusing syllable repetition for plural", "Not using 'mga' before plural nouns"]
    },
    {
        rule_id: "GRAM-008",
        rule_name: "Ang/Ng/Sa Pronouns",
        difficulty: "Beginner",
        topic: "Nouns & Pronouns",
        base_definition: "Ang paggamit ng iba't ibang anyo ng pronoun depende sa kanilang papel sa pangungusap.",
        description: "Ang mga pronoun sa Tagalog ay may iba't ibang anyo depende sa case (papel) nila. Ang 'ako' (I) ay nagiging 'ko' sa possessive, at 'kin' sa prepositional.",
        example: "Ako ang may libro. (I am the one with the book.) / Ang libro ko ay bago. (My book is new.) / Para sa akin. (For me.)",
        explanation: "Ang bawat pronoun ay may tatlong anyo: nominative (ang-form), genitive (ng-form), at oblique (sa-form).",
        related_concepts: ["Person and Number", "Voice Types", "Agreement"],
        common_mistakes: ["Using wrong form of pronoun", "Confusing nominative and genitive forms"]
    },
    {
        rule_id: "GRAM-009",
        rule_name: "Kita Pronoun System",
        difficulty: "Beginner",
        topic: "Nouns & Pronouns",
        base_definition: "Ang espesyal na paraan ng paggamit ng pronoun kapag nagsasalita tungkol sa iyo at ako, na karaniwang ginagamit sa Tagalog.",
        description: "Kapag nagsasalita ka sa isa, madalas mong gamitin ang 'tayo' (we-inclusive) o 'kami' (we-exclusive). Ang 'kita' ay dating paggamit para sa 'you and me together'.",
        example: "Tayo ay magkakaibigan. (We are friends - including the person being spoken to.)",
        explanation: "Ang Tagalog ay nag-iiba sa pagitan ng inclusive we (kasama ang nakikinig) at exclusive we (hindi kasama ang nakikinig). Ito ay mahalagang kultura ng wika.",
        related_concepts: ["Inclusive/Exclusive Pronouns", "Formality Levels", "Social Deixis"],
        common_mistakes: ["Confusing tayo and kami", "Not considering the context of who is included"]
    },
    {
        rule_id: "GRAM-010",
        rule_name: "Adjectives and Nouns Agreement",
        difficulty: "Beginner",
        topic: "Adjectives",
        base_definition: "Kung paano nag-uugnay ang mga pang-uri (adjectives) sa mga pangalan sa Tagalog.",
        description: "Sa Tagalog, ang mga adjective ay karaniwang sumusunod sa noun na minamodify nila. Ang adjective ay dapat tumugon sa gender at number ng noun.",
        example: "Ang malaking bahay (The big house) / Ang mga magagandang bulaklak (The beautiful flowers)",
        explanation: "Ang pang-uri na 'malaki' at 'maganda' ay tumutugon sa numero at pagiging animate ng noun. Kapag plural ang noun, ang adjective ay umuulit din ng unang pantig.",
        related_concepts: ["Predicate Adjectives", "Stative Verbs", "Modification"],
        common_mistakes: ["Wrong word order (adjective before noun)", "Not repeating syllable for plural adjectives"]
    },
    {
        rule_id: "GRAM-011",
        rule_name: "Gender-Specific Adjectives",
        difficulty: "Beginner",
        topic: "Adjectives",
        base_definition: "Ang mga pang-uri na may iba't ibang anyo para sa iba't ibang kasarian ng noun.",
        description: "Kahit na ang Tagalog ay karaniwang walang gender sa nouns, ang mga pang-uri na nanggagaling sa Spanish ay maaaring magbago depende sa noun na sinusundan nila.",
        example: "Maganda (feminine singular) / Magandong (used before noun) / Magandong lalaki (beautiful man)",
        explanation: "Ang mga adjective na tulad ng 'maganda' ay maaaring magbago ng dulo depende sa context at noun na sinusundan.",
        related_concepts: ["Loanword Adaptation", "Morphological Change", "Agreement Rules"],
        common_mistakes: ["Using masculine forms with feminine nouns", "Over-applying gender rules"]
    },
    {
        rule_id: "GRAM-012",
        rule_name: "Degrees of Adjectives",
        difficulty: "Beginner",
        topic: "Adjectives",
        base_definition: "Ang pagbabago ng adjectives upang ipakita ang mas mataas o pinakamataas na antas ng kalidad.",
        description: "Ang Tagalog ay gumagamit ng prefixes at particles upang makagawa ng comparative (mas...) at superlative (pinaka...) forms.",
        example: "Maganda (beautiful) → mas maganda (more beautiful) → pinakamaganda (most beautiful)",
        explanation: "Ang 'mas' ay ginagamit para sa comparative, at 'pinaka-' ay prefix para sa superlative. Ito ay mas simple kaysa sa Ingles na 'er' at 'est' endings.",
        related_concepts: ["Comparative Forms", "Superlative Forms", "Intensifiers"],
        common_mistakes: ["Using 'very' translations instead of 'mas'", "Incorrect stress with 'pinaka-'"]
    },
    {
        rule_id: "GRAM-013",
        rule_name: "Comparative Adjectives",
        difficulty: "Beginner",
        topic: "Adjectives",
        base_definition: "Ang paraan ng paghahambing ng dalawang bagay gamit ang adjectives sa Tagalog.",
        description: "Ang comparative ay nabubuo sa pamamagitan ng paglalagay ng 'mas' bago ang adjective. Ang 'kaysa' ay ginagamit para sa 'than'.",
        example: "Ang libro ay mas mahal kaysa sa notebook. (The book is more expensive than the notebook.)",
        explanation: "Ang structure ay 'mas + adjective + kaysa sa + comparison'. Ito ay mas direkta at simple kaysa sa Ingles.",
        related_concepts: ["Equality Comparisons", "Gradable Adjectives", "Comparison Markers"],
        common_mistakes: ["Forgetting 'kaysa'", "Wrong word order in comparison"]
    },
    {
        rule_id: "GRAM-014",
        rule_name: "Verb-Subject-Object Word Order",
        difficulty: "Beginner",
        topic: "Sentence Types",
        base_definition: "Ang pangunahing kaayusan ng mga salita sa isang Tagalog na pangungusap.",
        description: "Ang Tagalog ay sumusunod sa V-S-O na kaayusan, na naiiba sa English na S-V-O. Ang pandiwa ay unang pumapasok, lumalabas ang paksa sa gitna, at ang bagay ay nasa wakas.",
        example: "Kumain ang bata ng bigas. (Ate the child rice.)",
        explanation: "Ang 'kumain' ay nanggagaling unang, ang paksa ay 'ang bata', at ang bagay ay 'ng bigas'. Ito ay kakaiba sa English na 'The child ate rice.'",
        related_concepts: ["Neutral Focus", "Focus Systems", "Topicalization"],
        common_mistakes: ["Using English S-V-O order", "Incorrect case marker placement"]
    },
    {
        rule_id: "GRAM-015",
        rule_name: "Declarative Sentences",
        difficulty: "Beginner",
        topic: "Sentence Types",
        base_definition: "Ang pangungusap na nagsasaad ng katotohanan o kaganapan.",
        description: "Ang deklaratibong pangungusap ay nagbibigay ng impormasyon at nagtatapos ng tuldok. Ito ang pinakakaraniwang uri ng pangungusap sa pang-araw-araw na usapan.",
        example: "Masaya ang buhay. (Life is happy.) / Maglaro ang mga bata sa paaralan. (The children played at school.)",
        explanation: "Ang deklaratibong pangungusap ay maaaring nasa nakaraang, kasalukuyan, o hinaharap na panahon. Ang intonasyon ay normal, hindi tumataas sa dulo.",
        related_concepts: ["Statement Sentences", "Affirm and Negate", "Aspect Marking"],
        common_mistakes: ["Using question intonation", "Wrong verb form for tense"]
    },
    {
        rule_id: "GRAM-016",
        rule_name: "Interrogative Sentences",
        difficulty: "Beginner",
        topic: "Sentence Types",
        base_definition: "Ang pangungusap na nagtanong at may sagot na yes o no, o hinihiling ng espesyal na impormasyon.",
        description: "Ang mga tanong sa Tagalog ay nabubuo sa pamamagitan ng pag-add ng question marker 'ba' o sa pamamagitan ng pag-reorder ng salita. Ang intonasyon ay tumataas sa dulo.",
        example: "Kumain ka na ba? (Have you eaten already?) / Sino ang pumunta sa tindahan? (Who went to the store?)",
        explanation: "Ang 'ba' ay ginagamit para sa yes/no questions, habang ang 'sino', 'ano', 'saan', atbp. ay ginagamit para sa information questions.",
        related_concepts: ["Question Particles", "WH-Questions", "Tag Questions"],
        common_mistakes: ["Forgetting 'ba' in yes/no questions", "Wrong question word for context"]
    },
    {
        rule_id: "GRAM-017",
        rule_name: "Imperative Sentences",
        difficulty: "Beginner",
        topic: "Sentence Types",
        base_definition: "Ang pangungusap na nagbibigay ng utos, alok, o kahilingan.",
        description: "Ang imperative ay ipinahayag sa pamamagitan ng pag-tanggal ng 'ka' sa pangungusap o sa pamamagitan ng direktang pag-utos. Ang paksa ay hindi kailanman ipinakikita dahil ito ay 'ka' (ikaw).",
        example: "Kumain na! (Eat now!) / Bumili ng mga bigas. (Buy rice.) / Magpahinga tayo. (Let's rest.)",
        explanation: "Ang imperative ay walang paksa na ipinakikita. Ang verb form ay direkta na utos. Ang tone ay importante - maaaring maging commanding o friendly.",
        related_concepts: ["Jussive Moods", "Hortative", "Prohibitive"],
        common_mistakes: ["Adding unnecessary pronouns", "Wrong verb form for request vs. command"]
    },
    {
        rule_id: "GRAM-018",
        rule_name: "Exclamatory Sentences",
        difficulty: "Beginner",
        topic: "Sentence Types",
        base_definition: "Ang pangungusap na nagpapakita ng matinding damdamin o emosyon.",
        description: "Ang exclamatory sentence ay nagpapahayag ng pagpapasabik, sorpresa, alalahanin, o iba pang malakas na damdamin. Nagtatapos ng padamdam na tanda (!).",
        example: "Maganda! (Beautiful!) / Napakalungkot nito! (This is so sad!) / Ay, hindi ko inaasahan! (Oh, I didn't expect this!)",
        explanation: "Ang exclamatory ay nagpapakita ng intensidad. Ang 'napaka-' prefix ay ginagamit upang ipakita ang sobrang antas ng quality.",
        related_concepts: ["Intensifiers", "Emotional Expression", "Interjections"],
        common_mistakes: ["Using statement instead of exclamatory", "Wrong intensifier form"]
    },
    {
        rule_id: "GRAM-019",
        rule_name: "Verb Groups and Affixes",
        difficulty: "Intermediate",
        topic: "Verb Conjugation",
        base_definition: "Ang iba't ibang uri ng pandiwa at kung paano sila nagbabago gamit ang iba't ibang unlapi at suklapi.",
        description: "Ang Tagalog ay may limang pangunahing grupo ng pandiwa batay sa kanilang unlapi: mag-, ma-, um-, in-, at i-. Bawat grupo ay may iba't ibang kahulugan at uso.",
        example: "Mag- (actor focus): Magbigay (give) / Ma- (patient focus): Mabigyan (be given) / Um- (actor focus): Umasa (hope)",
        explanation: "Ang bawat grupo ay may pabaybay na kanya-kanyang paraan at kahulugan. Ang 'mag-' ay para sa aktong aksyon, ang 'ma-' ay para sa affected na aksyon, ang 'um-' ay para sa aktibong intransitive.",
        related_concepts: ["Voice Systems", "Focus Types", "Transitivity"],
        common_mistakes: ["Mixing up verb groups", "Wrong affix for intended meaning"]
    },
    {
        rule_id: "GRAM-020",
        rule_name: "Past, Present, and Future Tense",
        difficulty: "Intermediate",
        topic: "Verb Conjugation",
        base_definition: "Ang pagbabago ng pandiwa upang ipakita kung kailan naganap ang aksyon.",
        description: "Ang Tagalog ay gumagamit ng iba't ibang prefixes at infixes upang ipakita ang tense. Past ay 'nag-', 'na-'; Present ay 'nag-', 'nag-a-'; Future ay 'mag-'.",
        example: "Naglaro (played) / Naglalaro (is playing) / Maglalaro (will play)",
        explanation: "Ang tense system ay nakabatay sa prefix at infix. Ang repetisyon ng unang pantig ay nagpapakita ng habitual o durative action.",
        related_concepts: ["Aspect System", "Habitual Action", "Perfectivity"],
        common_mistakes: ["Confusing aspect with tense", "Wrong prefix-infix combination"]
    },
    {
        rule_id: "GRAM-021",
        rule_name: "Verb Repetition for Prolonged Action",
        difficulty: "Intermediate",
        topic: "Verb Conjugation",
        base_definition: "Ang paggamit ng repetisyon ng unang pantig ng pandiwa upang ipakita na pangmatagalan o paulit-ulit ang aksyon.",
        description: "Tulad ng sa nouns, ang pandiwa ay maaaring mag-ulit ng unang pantig upang ipakita ang habitual o prolonged action.",
        example: "Tumatakbo (is running) vs. Tatatatakbo (is continuously/repeatedly running)",
        explanation: "Ang syllable repetition sa verbs ay ipinapakita ang continuity o habituality. Ito ay mas nuanced kaysa simple present.",
        related_concepts: ["Iterative Aspect", "Habitual Action", "Continuative"],
        common_mistakes: ["Over-repetition", "Not using with correct tense"]
    },
    {
        rule_id: "GRAM-022",
        rule_name: "Connectors and Conjunctions (At, Dahil, Kasi)",
        difficulty: "Intermediate",
        topic: "Complex Structures",
        base_definition: "Ang mga salitang gumagamit upang ikonekta ang mga inoindependent na pangungusap o klaws.",
        description: "Ang 'at' ay ginagamit para sa coordination (and), 'dahil' at 'kasi' ay ginagamit para sa cause (because). Ang mga ito ay nagbibigay ng kumplikadong relasyon sa pagitan ng ideas.",
        example: "Kumain kami at uminom ng tubig. (We ate and drank water.) / Hindi kami naglaro dahil/kasi umuulan. (We didn't play because it was raining.)",
        explanation: "Ang 'at' ay simpleng connector, habang ang 'dahil' ay mas formal at 'kasi' ay mas casual. Ang 'kasi' ay madalas na ginagamit sa pang-araw-araw na usapan.",
        related_concepts: ["Subordination", "Coordination", "Cause and Effect"],
        common_mistakes: ["Using 'at' for causation", "Wrong formality level of connector"]
    },
    {
        rule_id: "GRAM-023",
        rule_name: "Relative Clauses with 'Na'",
        difficulty: "Intermediate",
        topic: "Complex Structures",
        base_definition: "Ang paggamit ng 'na' upang lumikha ng klaws na naglalarawan ng noun.",
        description: "Ang 'na' ay ginagamit upang ikonekta ang isang describing clause sa noun. Ito ay katulad ng 'who', 'which', 'that' sa English.",
        example: "Ang bata na sumusugal ay matalino. (The child who is participating is smart.) / Ang libro na binasa ko ay masaya. (The book that I read is fun.)",
        explanation: "Ang 'na' ay lumalabas kaagad pagkatapos ng noun na dine-describe. Ang relative clause ay nagbibigay ng dagdag na impormasyon tungkol sa noun.",
        related_concepts: ["Adjective Clauses", "Embedded Clauses", "Modification"],
        common_mistakes: ["Omitting 'na'", "Wrong placement of 'na'"]
    },
    {
        rule_id: "GRAM-024",
        rule_name: "Conditional Clauses with 'Kung'",
        difficulty: "Intermediate",
        topic: "Complex Structures",
        base_definition: "Ang paggamit ng 'kung' upang lumikha ng conditional o 'if' na mga pangungusap.",
        description: "Ang 'kung' ay ginagamit para sa conditional statements. Ito ay nagpapakita ng isang condition na dapat matupad bago mangyari ang pangunahing aksyon.",
        example: "Kung gusto mo, sasama kami. (If you want, we will come along.) / Kung nag-aral siya, papasa siya. (If he studies, he will pass.)",
        explanation: "Ang 'kung' clause ay maaaring nasa simula o sa dulo ng pangungusap. Ang syntax ay flexible depende sa emphasis.",
        related_concepts: ["Hypothetical Statements", "Subjunctive Mood", "If-Then Logic"],
        common_mistakes: ["Using 'dahil' for 'kung'", "Wrong tense sequence"]
    },
    {
        rule_id: "GRAM-025",
        rule_name: "English-to-Filipino Translation Patterns",
        difficulty: "Intermediate",
        topic: "Complex Structures",
        base_definition: "Ang mga karaniwang pagkakaiba at patterns sa pagsasalin mula Ingles tungo sa Tagalog.",
        description: "Ang Tagalog at Ingles ay may iba't ibang word order, tense system, at focus structures. Ang direktang pagsasalin ay madalas na hindi gumagana.",
        example: "English: 'I see a big house.' → Tagalog: 'Nakikita ko ang malaking bahay.' (Focus on the object, not the subject)",
        explanation: "Ang Ingles ay subject-focused (S-V-O), habang ang Tagalog ay may flexible focus system. Ang direktang pagsasalin ay madalas na lumilikha ng hindi natural na mga pangungusap.",
        related_concepts: ["Focus Systems", "Information Structure", "Language Transfer"],
        common_mistakes: ["Literal word-for-word translation", "Using English word order in Tagalog"]
    }
];
