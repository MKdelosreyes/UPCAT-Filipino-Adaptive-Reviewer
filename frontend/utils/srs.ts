export type SrsCardState = {
  id: number;          // word ID
  interval: number;    // days
  repetition: number;  // reps count (note: was 'repetition' not 'repetitions')
  ease: number;        // ease factor (EF)
  due: string;         // ISO date when due
};

export type SrsGrade = 0 | 1 | 2 | 3 | 4 | 5;

// Map UI actions to SM-2 grades
export const SRS_GRADES = {
  BLACKOUT: 0,        // Complete failure - no memory at all
  INCORRECT: 1,       // Incorrect, but upon seeing answer, remembered
  HARD: 2,            // Incorrect, but easy to recall after seeing ("Still Learning")
  CORRECT_HARD: 3,    // Correct with serious difficulty
  CORRECT: 4,         // Correct with hesitation ("I Know This")
  PERFECT: 5,         // Perfect instant recall
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export function initSrsCard(id: number, now = new Date()): SrsCardState {
  return {
    id,
    interval: 0,
    repetition: 0,
    ease: 2.5,
    due: now.toISOString(),
  };
}

export function applySm2(
  state: SrsCardState,
  grade: SrsGrade,
  now = new Date()
): SrsCardState {
  let { repetition, ease, interval } = state;

  // Fail (grades < 3): reset repetition and set interval to 1 day
  if (grade < 3) {
    repetition = 0;
    interval = 1;
  } else {
    // Success
    if (repetition === 0) interval = 1;
    else if (repetition === 1) interval = 6;
    else interval = Math.round(interval * ease);

    repetition += 1;
    ease = Math.max(1.3, ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
  }

  const due = new Date(now.getTime() + interval * DAY_MS).toISOString();

  return { 
    ...state, 
    repetition, 
    ease, 
    interval, 
    due 
  };
}

export function isDue(state: SrsCardState, now = new Date()): boolean {
  return new Date(state.due).getTime() <= now.getTime();
}

// Helper to get days until due
export function getDaysUntilDue(state: SrsCardState, now = new Date()): number {
  const dueDate = new Date(state.due);
  const diffMs = dueDate.getTime() - now.getTime();
  return Math.ceil(diffMs / DAY_MS);
}