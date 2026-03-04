export type MotivationalQuote = {
  text: string;
  author?: string;
  lang?: "en" | "fil";
};

export const MOTIVATIONAL_EXAM_QUOTES: MotivationalQuote[] = [
  // EN — exam vibe
  { text: "Read the question twice. Answer once.", lang: "en" },
  { text: "Accuracy first. Speed follows.", lang: "en" },
  { text: "You trained for this. Trust the reps.", lang: "en" },
  { text: "Calm mind, clean answers.", lang: "en" },
  { text: "One item at a time. No panic scrolling.", lang: "en" },
  { text: "Your future self is cheering quietly.", lang: "en" },
  { text: "If it’s hard, it means it’s working.", lang: "en" },
  { text: "Don’t rush. Don’t freeze. Proceed.", lang: "en" },
  { text: "Breathe in. Breathe out. Next question.", lang: "en" },

  // EN — meme-ish but still appropriate
  { text: "brain.exe loading… please wait.", lang: "en" },
  { text: "Manifesting correct answers in 3…2…1…", lang: "en" },
  { text: "No thoughts, just items.", lang: "en" },
  { text: "Plot twist: you actually know this.", lang: "en" },
  { text: "Main character moment: focus mode.", lang: "en" },

  // FIL — exam vibe
  { text: "Kaya mo ’to. Isa-isa lang.", lang: "fil" },
  { text: "Basa muna. Intindi muna. Sagot na.", lang: "fil" },
  { text: "Hinga. Kalma. Tuloy.", lang: "fil" },
  { text: "Huwag magmadali—linawin ang tanong.", lang: "fil" },
  { text: "Sa bawat item, mas lumalakas ka.", lang: "fil" },
  { text: "Tiwala sa proseso. Tiwala sa sarili.", lang: "fil" },

  // FIL — meme-ish but safe
  { text: "Utak, gising. May pangarap tayo.", lang: "fil" },
  { text: "Focus lang. Walang overthink.", lang: "fil" },
  { text: "Kung kinakabahan ka, ibig sabihin mahalaga.", lang: "fil" },
];

export function pickMotivationalQuote(
  prevText?: string,
): MotivationalQuote | null {
  if (MOTIVATIONAL_EXAM_QUOTES.length === 0) return null;
  if (MOTIVATIONAL_EXAM_QUOTES.length === 1) return MOTIVATIONAL_EXAM_QUOTES[0];

  // avoid repeating the same quote back-to-back when possible
  let next =
    MOTIVATIONAL_EXAM_QUOTES[
      Math.floor(Math.random() * MOTIVATIONAL_EXAM_QUOTES.length)
    ]!;

  if (prevText) {
    let guard = 0;
    while (next.text === prevText && guard < 10) {
      next =
        MOTIVATIONAL_EXAM_QUOTES[
          Math.floor(Math.random() * MOTIVATIONAL_EXAM_QUOTES.length)
        ]!;
      guard++;
    }
  }

  return next;
}