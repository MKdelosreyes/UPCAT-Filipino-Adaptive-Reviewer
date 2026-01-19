// Grammar lesson cards extracted from grammar.json
// Used for the lesson-cards study exercise in the grammar module

export interface GrammarLessonCard {
  id: string;
  ruleName: string;
  description: string;
  example: string;
  explanation: string;
  difficulty: string;
}

export const grammarLessonCards: GrammarLessonCard[] = [
  {
    id: "grammar-1",
    ruleName: "Roots and Affixes",
    description:
      "Ang mga ugat na pinagsama sa unlapi ay bumubuo ng iba't ibang salita; ang mga unlapi ay nagbabago ng kahulugan at papel sa gramatika.",
    example: "kain → kinain (past) → kainin (imperative)",
    explanation:
      "Sa Filipino, ang mga unlapi ay nagbabago ng ugat na salita upang lumikha ng iba't ibang kahulugan at panahon. Ang ugat na 'kain' (kumain) ay nagbabago ng anyo sa iba't ibang unlapi upang ipakita kung kailan nangyari ang aksyon.",
    difficulty: "Beginner",
  },
  {
    id: "grammar-2",
    ruleName: "Sentence Structure",
    description:
      "Ang pagkakasunod-sunod ng mga salita sa Tagalog ay iba sa English; ang paksa ay minarkahan sa pamamagitan ng mga particle marker tulad ng 'ang'.",
    example: "Maganda ang kotse. (The car is beautiful.)",
    explanation:
      "Hindi tulad ng English na gumagamit ng Subject-Verb-Object, ang Filipino ay madalas na nagsisimula sa descriptor, pagkatapos ay gumagamit ng marker 'ang' upang ipakita ang paksa. Ang istrakturang ito ay nagbibigay-diin sa kalidad o aksyon.",
    difficulty: "Beginner",
  },
  {
    id: "grammar-3",
    ruleName: "Pronunciation and Sounds",
    description:
      "Ang ilang tunog ng patinig ay maaaring magbago sa nagsasalitang Filipino.",
    example: "lalaki → lalake (spoken variant)",
    explanation:
      "Sa casual na nagsasalitang Filipino, ang mga tunog ng patinig sa dulo ng mga salita ay maaaring magbago. Ang salitang 'lalaki' (lalaki) ay madalas na binibigkas bilang 'lalake' sa pang-araw-araw na usapan.",
    difficulty: "Beginner",
  },
  {
    id: "grammar-4",
    ruleName: "Syllable Repetition",
    description:
      "Ang pag-ulit ng pantig ay isang pattern sa conjugation ng pandiwa (hinaharap na panahon).",
    example: "balik → babalik (will return)",
    explanation:
      "Upang bumuo ng hinaharap na panahon, ulitin ang unang pantig ng pandiwa. Ang 'balik' ay nagiging 'babalik' upang ipakita na ang aksyon ay mangyayari sa hinaharap.",
    difficulty: "Beginner",
  },
  {
    id: "grammar-5",
    ruleName: "Markers (ang, ng, sa)",
    description:
      "Ang mga marker ay nagpapakita ng mga papel sa gramatika tulad ng focus ng paksa, pagmamari, at direksyon.",
    example: "Matalino ang babae. (The woman is intelligent.)",
    explanation:
      "Ang marker 'ang' ay nagpapakita ng paksa na nakatuon. Ang 'ng' ay nagpapakita ng pagmamari, at ang 'sa' ay nagpapakita ng lokasyon o direksyon. Ang mga marker na ito ay mahalaga upang maintindihan kung sino o ano ang pinag-uusapan.",
    difficulty: "Beginner",
  },
  {
    id: "grammar-6",
    ruleName: "Gender Neutrality",
    description:
      "Ang mga pangalan at panghalip sa Filipino ay karaniwang walang kasarian.",
    example: "Siya yung sinasabi ko. (He/She was the one I was talking about.)",
    explanation:
      "Ang panghalip 'siya' ay ginagamit para sa parehong 'siya (lalaki)' at 'siya (babae)'. Ang konteksto ay tumutukoy ng kasarian. Ito ay isa sa pinakasimpleng aspeto ng gramatika ng Filipino.",
    difficulty: "Beginner",
  },
  {
    id: "grammar-7",
    ruleName: "Plurals",
    description:
      "Ang mga pangalan na plural ay gumagamit ng marker 'mga' bago ang pangalan.",
    example: "ibon → mga ibon (birds)",
    explanation:
      "Upang gawing plural ang isang pangalan sa Filipino, magdagdag ng marker 'mga' bago ito. Ang 'ibon' (ibon) ay nagiging 'mga ibon' (mga ibon). Ito ay mas simple kaysa sa mga panuntunan ng plural sa English.",
    difficulty: "Beginner",
  },
  {
    id: "grammar-8",
    ruleName: "Ang Pronouns",
    description:
      "Ang mga panghalip na nagsisilbing focus ng paksa sa mga pangungusap.",
    example: "ako (I), sila (they)",
    explanation:
      "Ang mga ito ay mga panghalip ng paksa na ginagamit kapag ang isang tao ay nakatuon sa aksyon. Sila ay ginagamit bago ang pandiwa o sa simula ng isang pahayag.",
    difficulty: "Beginner",
  },
  {
    id: "grammar-9",
    ruleName: "Ng Pronouns",
    description:
      "Ang mga panghalip para sa pagmamari o mga aktor na walang focus.",
    example: "ko (my), namin (our - exclusive)",
    explanation:
      "Ang mga panghalipang ito ay nagpapakita ng pagmamari o kapag ang gumagawa ay hindi ang pangunahing focus. Ang 'ko' ay nangangahulugang 'akin' o 'sa akin', at ang 'namin' ay nangangahulugang 'sa amin' kapag hindi kasama ang nakikinig.",
    difficulty: "Beginner",
  },
  {
    id: "grammar-10",
    ruleName: "Sa Pronouns",
    description:
      "Ang mga panghalip na nagpapakita ng lokasyon, direksyon, o pagmamari.",
    example: "akin (me/my), iyo (you/your)",
    explanation:
      "Ang mga panghalipang ito ay ginagamit pagkatapos ng marker 'sa' o sa mga tanong. Ipinapakita nila ang lokasyon o maaaring gumana bilang mga pagmamari sa ilang mga konteksto.",
    difficulty: "Beginner",
  },
  {
    id: "grammar-11",
    ruleName: "Kita",
    description:
      "Isang espesyal na panghalip para sa mga kombinasyon tulad ng ako-ikaw.",
    example: "Mahal kita. (I love you.)",
    explanation:
      "Ang panghalip 'kita' ay isang espesyal na anyo na pinagsasama ang 'ka' (ikaw) at 'ko' (akin). Ito ay ginagamit sa mga romantic o malapit na konteksto at nakakaraniwang makita sa Filipino.",
    difficulty: "Beginner",
  },
  {
    id: "grammar-12",
    ruleName: "Verb Groups",
    description:
      "Ang mga pandiwa ay naipapangkat ayon sa unlapi (mag-, ma-, um-, in-, i-).",
    example: "aral (study) → nag-aral (studied with mag- affix)",
    explanation:
      "Ang iba't ibang awit ng pandiwa ay nagbabago ng kahulugan at focus. Ang 'nag-' ay nagpapakita ng focus ng gumagawa (mag- sa nakaraan), ang 'ma-' ay nagpapakita ng hindi-gumagawa na focus, ang 'um-' ay isa pang focus ng gumagawa, at ang 'in-' at 'i-' ay nagpapakita ng focus ng bagay.",
    difficulty: "Intermediate",
  },
  {
    id: "grammar-13",
    ruleName: "Verb Repetition for Prolonged Action",
    description:
      "Ang mga paulit-ulit na pandiwa kasama ang 'nang' ay nagpapahayag ng patuloy na mga aksyon.",
    example: "Kain nang kain si Raul. (Raul keeps on eating.)",
    explanation:
      "Ang pag-ulit ng pandiwa kasama ang 'nang' (habang) ay nagpapakita na ang aksyon ay patuloy o nababasag ng maraming beses. Ito ay nagbibigay-diin sa tagal o kalidad ng aksyon.",
    difficulty: "Intermediate",
  },
  {
    id: "grammar-14",
    ruleName: "Adjective-Noun Identicals",
    description:
      "Ang ilang mga pang-uri ay may parehong spelling tulad ng mga pangalan ngunit naiiba ang pagbibigkas.",
    example: "buhay (life/alive), gutom (hunger/hungry)",
    explanation:
      "Sa Filipino, ang ilang mga salita ay maaaring gumana bilang parehong pangalan at pang-uri depende sa konteksto at stress ng pagbibigkas. Ang 'buhay' ay maaaring magkahulugan ng 'buhay' o 'nabubuhay' depende sa paraan ng paggamit.",
    difficulty: "Beginner",
  },
  {
    id: "grammar-15",
    ruleName: "Adjective Gender",
    description:
      "Ang ilang mga pang-uri ay nagbabago ng anyo batay sa kasarian (karaniwan ay nagtatapos sa -a para sa babae).",
    example: "ambisyoso (ambitious male) → ambisyosa (ambitious female)",
    explanation:
      "Ang ilang mga pang-uri sa Filipino ay nagbabago ng mga dulo upang tumugma sa kasarian. Ang mga salitang nagtatapos sa -o ay karaniwang tumutukoy sa mga lalaki, habang ang mga dulo ng -a ay tumutukoy sa mga babae.",
    difficulty: "Beginner",
  },
  {
    id: "grammar-16",
    ruleName: "Degrees of Adjectives",
    description:
      "Ang mga pang-uri ay lumalaki sa pamamagitan ng pag-ulit o pagdaragdag ng mga unlapi.",
    example: "batang-bata (very young), pinakamaganda (the most beautiful)",
    explanation:
      "Upang gawing mas malakas ang isang pang-uri, maaari mong ulitin ang unang pantig o magdagdag ng unlapi na 'pinaka-' para sa superlatives. Ito ang paraan ng paggana ng intensifiers sa Filipino.",
    difficulty: "Beginner",
  },
  {
    id: "grammar-17",
    ruleName: "Typical Word Order (V-S-O)",
    description:
      "Ang Tagalog ay karaniwang gumagamit ng Verb-Subject-Object na pagkakasunod-sunod sa halip na English's S-V-O, na nagbibigay-diin sa aksyon muna.",
    example: "Nag-aaral si Maria ng Tagalog. (Maria is studying Tagalog.)",
    explanation:
      "Ang pandiwa ay unang dumadating upang magbigay-diin sa aksyon. Ito ay isang pangunahing pagkakaiba mula sa English. Ang pormal na bersyon ay nagdadagdag ng 'ay' para sa pagbibigay-diin: 'Si Maria ay nag-aaral ng Tagalog.'",
    difficulty: "Beginner",
  },
  {
    id: "grammar-18",
    ruleName: "Declarative Sentences",
    description: "Gamitin ang pandiwa-una upang ipahayag ang mga katotohanan.",
    example: "Kumain si Juan. (Juan ate.)",
    explanation:
      "Upang gumawa ng pahayag sa Filipino, ilagay ang pandiwa muna. Iwasan ang pattern ng English na Subject-Verb-Object, dahil tumutunog ito na hindi natural sa mga nagsasalita ng katutubong wika.",
    difficulty: "Beginner",
  },
  {
    id: "grammar-19",
    ruleName: "Interrogative Sentences",
    description:
      "Ang mga tanong ay naglalagay ng predicate/pandiwa o prase bago ang paksa at particle ng paksa.",
    example: "Pagod ka ba? (Are you tired?)",
    explanation:
      "Upang magtanong ng oo/hindi na tanong, magdagdag ng 'ba' pagkatapos ng predicate o pangunahing salita. Ang pagkakasunod-sunod ng mga salita ay katulad ng mga pahayag ngunit may 'ba' na idinagdag para sa pagtatanong.",
    difficulty: "Beginner",
  },
  {
    id: "grammar-20",
    ruleName: "Imperative Sentences",
    description:
      "Ang mga utos ay karaniwang nagsisimula sa pandiwa na sinusundan ng paksa.",
    example: "Pumasok ka. (Come in.)",
    explanation:
      "Upang magbigay ng utos, magsimula sa pandiwa at sundan ng panghalip ng paksa. Ito ay katulad ng English ngunit sumusunod sa natural na pattern ng Filipino na V-S-O.",
    difficulty: "Beginner",
  },
];
