export interface SentenceOrderingItem {
  id: string;
  skill: string;
  exerciseType: "sentence_ordering";
  difficulty: "easy" | "medium" | "hard";
  words: string[];
  correctSentence: string;
  subskill: string;
  explanation: string;
}

export interface FillMissingWordsItem {
  id: string;
  skill: string;
  exerciseType: "fill_missing_words";
  difficulty: "easy" | "medium" | "hard";
  sentence: string;
  choices: string[];
  correctAnswer: string;
  subskill: string;
  explanation: string;
}

export interface CreateSentenceItem {
  id: string;
  skill: string;
  exerciseType: "create_sentence";
  difficulty: "easy" | "medium" | "hard";
  prompt: string;
  targetConcepts: string[];
  exampleAnswer: string;
  subskill: string;
}

export interface CompleteSentenceItem {
  id: string;
  skill: string;
  exerciseType: "complete_sentence";
  difficulty: "easy" | "medium" | "hard";
  incompletePhrase: string;
  completion: string;
  correctCompletions: string[];
  explanation: string;
  subskill: string;
}

export interface ChooseSentenceItem {
  id: string;
  skill: string;
  exerciseType: "choose_sentence";
  difficulty: "easy" | "medium" | "hard";
  context: string;
  choices: string[];
  correctAnswer: string;
  subskill: string;
  explanation: string;
}

export type SentenceConstructionItem = 
  | SentenceOrderingItem 
  | FillMissingWordsItem 
  | CreateSentenceItem
  | CompleteSentenceItem
  | ChooseSentenceItem;

export const sentenceConstructionData: SentenceConstructionItem[] = [
  {
    "id": "SC-ORD-001",
    "skill": "sentence_construction",
    "exerciseType": "sentence_ordering",
    "difficulty": "easy",
    "words": ["Binasa", "niya", "ang", "aklat", "kahapon"],
    "correctSentence": "Binasa niya ang aklat kahapon.",
    "subskill": "word_order",
    "explanation": "Ang pandiwa ay nauuna, sinusundan ng paksa at layon, at karaniwang nasa hulihan ang pananda ng panahon."
  },
  {
    "id": "SC-ORD-002",
    "skill": "sentence_construction",
    "exerciseType": "sentence_ordering",
    "difficulty": "easy",
    "words": ["Masigasig", "na", "mag-aaral", "siya"],
    "correctSentence": "Masigasig na mag-aaral siya.",
    "subskill": "pang-angkop",
    "explanation": "Ginagamit ang 'na' bilang pang-angkop kapag nagtatapos sa katinig ang unang salita."
  },
  {
    "id": "SC-ORD-003",
    "skill": "sentence_construction",
    "exerciseType": "sentence_ordering",
    "difficulty": "medium",
    "words": ["Dahil", "nag-aral", "siya", "nang", "mabuti", "pumasa", "siya"],
    "correctSentence": "Dahil nag-aral siya nang mabuti, pumasa siya.",
    "subskill": "ugnayan_ng_pangungusap",
    "explanation": "Ang pangatnig na 'dahil' ay nagpapakita ng sanhi at dapat sundan ng bunga."
  },
  {
    "id": "SC-FILL-001",
    "skill": "sentence_construction",
    "exerciseType": "fill_missing_words",
    "difficulty": "easy",
    "sentence": "_____ nagsikap siya, natupad ang kanyang pangarap.",
    "choices": ["Dahil", "Ngunit", "Kung", "Samantala"],
    "correctAnswer": "Dahil",
    "subskill": "pang-ugnay",
    "explanation": "Ang 'dahil' ay ginagamit upang ipakita ang sanhi ng isang pangyayari."
  },
  {
    "id": "SC-FILL-002",
    "skill": "sentence_construction",
    "exerciseType": "fill_missing_words",
    "difficulty": "medium",
    "sentence": "Hindi siya pumasok _____ siya ay may sakit.",
    "choices": ["dahil", "ngunit", "kaya", "habang"],
    "correctAnswer": "dahil",
    "subskill": "pang-ugnay",
    "explanation": "Ipinapakita ng 'dahil' ang dahilan kung bakit hindi siya pumasok."
  },
  {
    "id": "SC-FILL-003",
    "skill": "sentence_construction",
    "exerciseType": "fill_missing_words",
    "difficulty": "medium",
    "sentence": "_____ matapos ang klase, umuwi na ang mga mag-aaral.",
    "choices": ["Kapag", "Pagkatapos", "Habang", "Bagaman"],
    "correctAnswer": "Pagkatapos",
    "subskill": "panandang_pangyayari",
    "explanation": "Ang 'pagkatapos' ay ginagamit upang ipakita ang sunod na pangyayari."
  },
  {
    "id": "SC-COMP-001",
    "skill": "sentence_construction",
    "exerciseType": "create_sentence",
    "difficulty": "easy",
    "prompt": "Gumawa ng pangungusap gamit ang salitang masipag.",
    "targetConcepts": ["pang-uri", "pang-angkop"],
    "exampleAnswer": "Masipag na mag-aaral si Ana.",
    "subskill": "pang-uri"
  },
  {
    "id": "SC-COMP-002",
    "skill": "sentence_construction",
    "exerciseType": "create_sentence",
    "difficulty": "medium",
    "prompt": "Gumawa ng pangungusap na nagpapakita ng sanhi at bunga.",
    "targetConcepts": ["pang-ugnay", "lohikal_na_ugnayan"],
    "exampleAnswer": "Dahil sa kanyang pagsisikap, siya ay nagtagumpay.",
    "subskill": "ugnayan_ng_pangungusap"
  },
  {
    "id": "SC-COMP-003",
    "skill": "sentence_construction",
    "exerciseType": "create_sentence",
    "difficulty": "medium",
    "prompt": "Gumawa ng pangungusap gamit ang pandiwang nasa aspektong naganap.",
    "targetConcepts": ["aspekto_ng_pandiwa"],
    "exampleAnswer": "Natapos niya ang proyekto kahapon.",
    "subskill": "aspekto_ng_pandiwa"
  },
  {
    "id": "SC-COMP-004",
    "skill": "sentence_construction",
    "exerciseType": "create_sentence",
    "difficulty": "hard",
    "prompt": "Gumawa ng pangungusap na may dalawang sugnay at gumagamit ng wastong pang-ugnay.",
    "targetConcepts": ["sugnay", "pang-ugnay", "kaayusan"],
    "exampleAnswer": "Bagaman mahirap ang pagsusulit, nagsikap siyang tapusin ito.",
    "subskill": "kompleks_na_pangungusap"
  },
  {
    "id": "SC-COMPL-001",
    "skill": "sentence_construction",
    "exerciseType": "complete_sentence",
    "difficulty": "easy",
    "incompletePhrase": "Ang araw ay napakaganda kaya...",
    "completion": "pumunta kami sa park.",
    "correctCompletions": ["pumunta kami sa park", "lumabas kami", "mag-enjoy kami"],
    "explanation": "Ang pangungusap ay kumpleto kung ang ikalawang bahagi ay nagpapatuloy ng ideya at may kahulugang kumpleto.",
    "subskill": "pagkakaugnay_ng_ideya"
  },
  {
    "id": "SC-COMPL-002",
    "skill": "sentence_construction",
    "exerciseType": "complete_sentence",
    "difficulty": "easy",
    "incompletePhrase": "Mahirap ang pagsusulit dahil...",
    "completion": "maraming leksyon ang dapat pag-aralan.",
    "correctCompletions": ["maraming leksyon ang dapat pag-aralan", "kailangan ng maraming oras", "kailangan ng sipag at tiyaga"],
    "explanation": "Ang 'dahil' ay nagpapakita ng sanhi, kaya ang pagkumpleto ay dapat magbigay ng dahilan.",
    "subskill": "kasugnayan_ng_pangangahulugan"
  },
  {
    "id": "SC-COMPL-003",
    "skill": "sentence_construction",
    "exerciseType": "complete_sentence",
    "difficulty": "medium",
    "incompletePhrase": "Bagaman matanda na siya, patuloy pa rin siyang...",
    "completion": "nag-aaral at nag-iimprove.",
    "correctCompletions": ["nag-aaral at nag-iimprove", "nag-trabaho", "aktibo pa rin"],
    "explanation": "Ang 'bagaman' ay nagpapakita ng kontra o pagkakataon, kaya ang pagkumpleto ay dapat magbigay ng aksyon na kontra sa inaasahan.",
    "subskill": "pagkakaugnay_ng_ideya"
  },
  {
    "id": "SC-COMPL-004",
    "skill": "sentence_construction",
    "exerciseType": "complete_sentence",
    "difficulty": "medium",
    "incompletePhrase": "Sumusunod sa mahabang oras ng pag-aaral, ang resulta...",
    "completion": "ay nagpakita ng kanyang pagsisikap.",
    "correctCompletions": ["ay nagpakita ng kanyang pagsisikap", "ay mas mahusay na nakaambag", "ay nagbunga ng magandang pagbabago"],
    "explanation": "Ang pangungusap ay dapat kumpleto sa pamamagitan ng resulta o sanaysay ng epekto.",
    "subskill": "kasugnayan_ng_pangangahulugan"
  },
  {
    "id": "SC-COMPL-005",
    "skill": "sentence_construction",
    "exerciseType": "complete_sentence",
    "difficulty": "hard",
    "incompletePhrase": "Kung hindi ninyo susundin ang mga tagubilin, ang...",
    "completion": "pagkakaiba-iba ng resulta ay maaaring mangyari.",
    "correctCompletions": ["pagkakaiba-iba ng resulta ay maaaring mangyari", "hindi ninyo maaabot ang layunin", "magiging mahirap ang gawain"],
    "explanation": "Ang 'kung' ay nagpapakita ng kondisyon, kaya ang pagkumpleto ay dapat magbigay ng posibleng resulta o epekto.",
    "subskill": "kondisyonal_na_pagpapahayag"
  },
  {
    "id": "SC-CHOOSE-001",
    "skill": "sentence_construction",
    "exerciseType": "choose_sentence",
    "difficulty": "easy",
    "context": "Ang pangungusap ay nagpapakita ng isang utos o bilin.",
    "choices": [
      "Magbasa ka ng libro ngayon.",
      "Ngayon ay magbasa ka ng libro.",
      "Ka ay magbasa ng libro ngayon."
    ],
    "correctAnswer": "Magbasa ka ng libro ngayon.",
    "subskill": "ayos_ng_pangungusap",
    "explanation": "Sa imperatibong pangungusap, ang pandiwa ay nasa unahan."
  },
  {
    "id": "SC-CHOOSE-002",
    "skill": "sentence_construction",
    "exerciseType": "choose_sentence",
    "difficulty": "medium",
    "context": "Ang pangungusap ay naglalarawan ng isang bagay na maaaring mangyari kung may kondisyon.",
    "choices": [
      "Kung mag-aaral ka nang mabuti, papasa ka.",
      "Papasa ka kung mag-aaral ka nang mabuti.",
      "Ka ay papasa kung mag-aaral nang mabuti."
    ],
    "correctAnswer": "Kung mag-aaral ka nang mabuti, papasa ka.",
    "subskill": "ugnayan_ng_pangungusap",
    "explanation": "Ang kondisyonal na pangungusap ay nagsisimula sa 'kung' na sinusundan ng bunga."
  },
  {
    "id": "SC-CHOOSE-003",
    "skill": "sentence_construction",
    "exerciseType": "choose_sentence",
    "difficulty": "easy",
    "context": "Ang pangungusap ay naglalarawan ng isang bagay na maaaring mangyari sa hinaharap.",
    "choices": [
      "Bibili ako ng bagong libro bukas.",
      "Bukas ay bibili ako ng bagong libro.",
      "Ako ay bibili ng bagong libro bukas."
    ],
    "correctAnswer": "Bibili ako ng bagong libro bukas.",
    "subskill": "ayos_ng_pangungusap",
    "explanation": "Sa aktibong boses, ang pandiwa ay nasa unahan ng paksa."
  },
  {
    "id": "SC-CHOOSE-004",
    "skill": "sentence_construction",
    "exerciseType": "choose_sentence",
    "difficulty": "medium",
    "context": "Ang pangungusap ay naglalarawan ng isang bagay na maaaring mangyari sa kasalukuyan.",
    "choices": [
      "Siya ay kumakanta sa entablado.",
      "Kumakanta siya sa entablado.",
      "Kumakanta sa entablado siya."
    ],
    "correctAnswer": "Kumakanta siya sa entablado.",
    "subskill": "ayos_ng_pangungusap",
    "explanation": "Sa aktibong boses, ang pandiwa ay nasa unahan ng paksa."
  },
  {
    "id": "SC-CHOOSE-005",
    "skill": "sentence_construction",
    "exerciseType": "choose_sentence",
    "difficulty": "easy",
    "context": "Ang pangungusap ay naglalarawan ng isang bagay na maaaring mangyari sa nakaraan.",
    "choices": [
      "Kumain na kami ng hapunan kahapon.",
      "Kahapon ay kumain na kami ng hapunan.",
      "Kami ay kumain na ng hapunan kahapon."
    ],
    "correctAnswer": "Kumain na kami ng hapunan kahapon.",
    "subskill": "ayos_ng_pangungusap",
    "explanation": "Sa aktibong boses, ang pandiwa ay nasa unahan ng paksa."
  },
  {
    "id": "SC-CHOOSE-006",
    "skill": "sentence_construction",
    "exerciseType": "choose_sentence",
    "difficulty": "hard",
    "context": "Ang pangungusap ay nagpapakita ng dahilan at bunga.",
    "choices": [
      "Dahil sa ulan, hindi kami lumabas.",
      "Hindi kami lumabas dahil sa ulan.",
      "Sa ulan ay hindi kami lumabas."
    ],
    "correctAnswer": "Dahil sa ulan, hindi kami lumabas.",
    "subskill": "ugnayan_ng_pangungusap",
    "explanation": "Ang 'dahil' ay nagpapakita ng sanhi at dapat sundan ng bunga."
  },
  {
    "id": "SC-CHOOSE-007",
    "skill": "sentence_construction",
    "exerciseType": "choose_sentence",
    "difficulty": "medium",
    "context": "Ipinapakita ng pangungusap ang aksyon ng guro sa klase.",
    "choices": [
      "Ang guro ay nagbigay ng aral sa klase.",
      "Nagbigay ang guro ng aral sa klase.",
      "Nagbigay ng aral ang guro sa klase."
    ],
    "correctAnswer": "Nagbigay ang guro ng aral sa klase.",
    "subskill": "ayos_ng_pangungusap",
    "explanation": "Ang tamang ayos ay pandiwa-paksa-layon para sa aktibong boses."
  }
] as const;