// Type definitions for grammar lesson cards
export interface GrammarLessonCard {
  id: string;
  ruleName: string;
  description: string;
  example: string;
  explanation: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  topic: string;
}

export interface GrammarLessonTopic {
  name: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  lessons: GrammarLessonCard[];
}
