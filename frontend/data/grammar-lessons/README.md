# Grammar Lessons Dataset

A comprehensive, organized grammar lesson dataset for the Filipino language learning platform. This dataset is structured for scalability and easy maintenance.

## Directory Structure

```
grammar-lessons/
├── types.ts                              # TypeScript interfaces and types
├── index.ts                              # Main index with helper functions
├── beginner-fundamental.ts               # Beginner: Fundamental Grammar Rules
├── beginner-nouns-pronouns.ts            # Beginner: Nouns & Pronouns
├── beginner-adjectives.ts                # Beginner: Adjectives
├── beginner-sentence-types.ts            # Beginner: Sentence Types
├── intermediate-verb-conjugation.ts      # Intermediate: Verb Conjugation
├── intermediate-complex-structures.ts    # Intermediate: Complex Structures
└── README.md                             # This file
```

## Current Statistics

- **Total Lessons**: 37
- **Beginner Lessons**: 22
- **Intermediate Lessons**: 15
- **Topics**: 8
  - Fundamental Rules
  - Nouns & Pronouns
  - Adjectives
  - Sentence Types
  - Verb Conjugation
  - Complex Structures

## Usage Examples

### Import all lessons
```typescript
import { allGrammarLessons } from "@/data/grammar-lessons";
```

### Import by difficulty
```typescript
import { beginnerLessons, intermediateLessons } from "@/data/grammar-lessons";
```

### Import by topic
```typescript
import { beginnerNounsPronounsLessons } from "@/data/grammar-lessons";
```

### Use helper functions
```typescript
import { 
  getLessonsByDifficulty, 
  getLessonsByTopic,
  getRandomLessons,
  getLessonStatistics 
} from "@/data/grammar-lessons";

// Get all beginner lessons
const beginners = getLessonsByDifficulty("Beginner");

// Get lessons by topic
const pronounsLessons = getLessonsByTopic("Nouns & Pronouns");

// Get random 15 lessons for practice
const randomLessons = getRandomLessons(15);

// Get statistics
const stats = getLessonStatistics();
```

## Lesson Card Structure

Each lesson card contains:

```typescript
interface GrammarLessonCard {
  id: string;                    // Unique identifier
  ruleName: string;              // Name of the grammar rule
  description: string;           // Filipino description
  example: string;               // Usage example with context
  explanation: string;           // Detailed Filipino explanation
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  topic: string;                 // Category/Topic name
}
```

## How to Extend

### Adding New Lessons

1. Create a new file in the appropriate difficulty level folder (or create a new one if needed):
   ```typescript
   // advanced-topic-name.ts
   import { GrammarLessonCard } from "./types";

   export const advancedTopicNameLessons: GrammarLessonCard[] = [
     {
       id: "advanced-topic-1",
       ruleName: "Rule Name",
       description: "Filipino description...",
       example: "Example usage...",
       explanation: "Detailed explanation...",
       difficulty: "Advanced",
       topic: "Topic Category",
     },
     // ... more lessons
   ];
   ```

2. Update `index.ts`:
   ```typescript
   import { advancedTopicNameLessons } from "./advanced-topic-name";
   
   export const advancedLessons = [
     ...advancedTopicNameLessons,
   ];
   
   export const allGrammarLessons = [
     ...beginnerLessons,
     ...intermediateLessons,
     ...advancedLessons,  // Add this
   ];
   ```

### Adding New Topics

Simply create a new file with the naming convention: `[difficulty]-[topic-name].ts` and follow the same pattern as existing files.

## Integration with Components

The grammar-lesson-cards.ts file was the original simplified version. Now you can import from this comprehensive dataset:

```typescript
// Old way (deprecated)
import { grammarLessonCards } from "@/data/grammar-lesson-cards";

// New way (recommended)
import { allGrammarLessons } from "@/data/grammar-lessons";
// or
import { beginnerLessons } from "@/data/grammar-lessons";
// or
import { getRandomLessons } from "@/data/grammar-lessons";
```

## Future Enhancements

- Add Advanced level lessons
- Add more intermediate lessons
- Create lesson progress tracking
- Add related vocabulary for each lesson
- Add interactive exercises per lesson
- Implement lesson difficulty progression system
