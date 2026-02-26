// "use client";

// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { ArrowLeft, RotateCcw, ChevronRight } from "lucide-react";
// import Link from "next/link";
// import AntonymQuestion from "@/components/vocabulary/antonym-exercise/AntonymQuestion";
// import AntonymProgress from "@/components/vocabulary/antonym-exercise/AntonymProgress";
// import AntonymCompletionModal from "@/components/vocabulary/antonym-exercise/AntonymCompletionModal";
// import { useVocabularyProgress } from "@/hooks/useVocabularyProgress";
// import { useLearningProgress } from "@/contexts/LearningProgressContext";
// import type { QuizProgress } from "@/contexts/LearningProgressContext";
// import {
//   underlineWordInSentence,
//   sentenceContainsWord,
// } from "@/utils/textFormatting";
// import { useAuth } from "@/contexts/AuthContext";
// import {
//   getVocabularyExercisesAdaptive,
//   getLexiconData,
//   type VocabularyExerciseItem,
//   type LexiconItem,
// } from "@/lib/api/exercises";
// import { updateExerciseProgress } from "@/lib/api/progress";
// import {
//   isLowFrequencyWord,
//   areSimilarWords,
// } from "@/utils/PerformanceTracker";
// import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";
// import { reportLexicalItemPerformance } from "@/utils/reportPerformance";
// import { useAuthGuard } from "@/hooks/useAuthGuard";
// import { useSRSWithExercises } from "@/hooks/useSRS";
// import { SRS_GRADES } from "@/utils/srs";
// import {
//   makeUserScopedStorageKey,
//   usePersistedQuizSession,
// } from "@/hooks/usePersistedQuizSession";

// interface AntonymItem {
//   id: string;
//   lemma_id: string;
//   sentence: string;
//   underlinedWord: string;
//   correctAnswer: string;
//   options: string[];
// }

// interface AntonymAnswer {
//   isCorrect: boolean;
//   selectedAnswer: string;
//   correctAnswer: string;
//   word: string;
// }

// type PersistedAntonymSessionV1 = {
//   questions: AntonymItem[];
//   currentQuestion: number;
//   selectedAnswer: string | null;
//   showResult: boolean;
//   answers: (boolean | null)[];
//   detailedAnswers: AntonymAnswer[];
//   currentDifficulty: "easy" | "medium" | "hard";
// };

// // ...existing code...
// // Generate antonym questions from AI service data
// async function generateAntonymQuestionsFromService(
//   sessionExercises: VocabularyExerciseItem[],
//   lexiconData: LexiconItem[],
// ): Promise<AntonymItem[]> {
//   // ...existing code...
//   return shuffled.slice(0, Math.min(10, shuffled.length));
// }

// export default function AntonymExercisePage() {
//   const { updateProgress, getExerciseProgress } = useVocabularyProgress();
//   const { getPerformanceHistory } = useLearningProgress();
//   const history = getPerformanceHistory("vocabulary", "antonym");
//   const fallbackDifficulty =
//     history.length > 0 ? history[history.length - 1].difficulty : "easy";

//   const { user } = useAuth();
//   const { isLoading: authLoading } = useAuthGuard();

//   const exerciseProgress = getExerciseProgress("antonym");
//   const difficultyToServe =
//     "lastDifficulty" in exerciseProgress
//       ? ((exerciseProgress as QuizProgress).lastDifficulty ??
//         fallbackDifficulty)
//       : fallbackDifficulty;

//   const {
//     sessionExercises,
//     grade: gradeSRS,
//     isLoading: srsLoading,
//   } = useSRSWithExercises({
//     module: "vocabulary",
//     targetDifficulty: difficultyToServe,
//     sessionSize: 10,
//     fetchLimit: 40,
//   });

//   const [questions, setQuestions] = useState<AntonymItem[]>([]);
//   const [currentQuestion, setCurrentQuestion] = useState(0);
//   const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
//   const [showResult, setShowResult] = useState(false);
//   const [answers, setAnswers] = useState<(boolean | null)[]>([]);
//   const [detailedAnswers, setDetailedAnswers] = useState<AntonymAnswer[]>([]);
//   const [showCompletion, setShowCompletion] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [currentDifficulty, setCurrentDifficulty] = useState<
//     "easy" | "medium" | "hard"
//   >("easy");

//   const sessionStorageKey = authLoading
//     ? null
//     : makeUserScopedStorageKey(user, "far:quizSession:vocabulary:antonym");

//   const { didRestore, clear: clearSession } =
//     usePersistedQuizSession<PersistedAntonymSessionV1>({
//       key: sessionStorageKey,
//       version: 1,
//       restoreWhen: !authLoading && !srsLoading,
//       persistWhen: !authLoading && !srsLoading,
//       isComplete: showCompletion,
//       clearOnComplete: true,
//       hasDataToPersist: questions.length > 0 && !isLoading && !error,
//       snapshot: () => ({
//         questions,
//         currentQuestion,
//         selectedAnswer,
//         showResult,
//         answers,
//         detailedAnswers,
//         currentDifficulty,
//       }),
//       restore: (payload) => {
//         setQuestions(payload.questions);
//         setCurrentQuestion(payload.currentQuestion);
//         setSelectedAnswer(payload.selectedAnswer);
//         setShowResult(payload.showResult);
//         setAnswers(payload.answers);
//         setDetailedAnswers(payload.detailedAnswers);
//         setCurrentDifficulty(payload.currentDifficulty);
//         setError(null);
//         setIsLoading(false);
//         setShowCompletion(false);
//       },
//       validate: (p: any): p is PersistedAntonymSessionV1 => {
//         if (!p || typeof p !== "object") return false;
//         if (!Array.isArray(p.questions)) return false;
//         if (!Number.isInteger(p.currentQuestion) || p.currentQuestion < 0)
//           return false;
//         if (
//           !(p.selectedAnswer === null || typeof p.selectedAnswer === "string")
//         )
//           return false;
//         if (typeof p.showResult !== "boolean") return false;
//         if (!Array.isArray(p.answers)) return false;
//         if (!Array.isArray(p.detailedAnswers)) return false;
//         if (!["easy", "medium", "hard"].includes(p.currentDifficulty))
//           return false;
//         if (p.questions.length === 0) return false;
//         if (p.answers.length !== p.questions.length) return false;
//         if (p.currentQuestion >= p.questions.length) return false;
//         return true;
//       },
//     });

//     useEffect(() => {
//     async function loadQuestions() {
//       if (didRestore) return;
//       if (srsLoading) return;
//       if (!sessionExercises || sessionExercises.length === 0) return;

//       try {
//         setIsLoading(true);

//         setCurrentDifficulty(difficultyToServe);

//         const lexiconData = await getLexiconData();

//         const qs = await generateAntonymQuestionsFromService(
//           sessionExercises as VocabularyExerciseItem[],
//           lexiconData,
//         );

//         if (qs.length === 0) {
//           throw new Error("No antonym items available for this session");
//         }

//         setQuestions(qs);
//         setAnswers(Array(qs.length).fill(null));
//         setDetailedAnswers([]);
//         setCurrentQuestion(0);
//         setSelectedAnswer(null);
//         setShowResult(false);
//         setError(null);
//       } catch (err) {
//         console.error("❌ Failed to load antonym items:", err);
//         setError(
//           err instanceof Error
//             ? err.message
//             : "Failed to load antonym items. Please try again.",
//         );
//       } finally {
//         setIsLoading(false);
//       }
//     }
//     loadQuestions();
//   }, [didRestore, srsLoading, sessionExercises, difficultyToServe]);

//   if (authLoading || srsLoading) {
//     return (
//       <div className="h-screen bg-yellow-50 flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
//       </div>
//     );
//   }

//   // ...existing code...

//   // Show error state
//   if (error || questions.length === 0) {
//     return (
//       <div className="h-screen bg-yellow-50 flex flex-col">
//         {/* ...existing code... */}
//         <div className="flex-1 flex items-center justify-center">
//           <div className="text-center max-w-md px-4">
//             <p className="text-yellow-600 font-semibold mb-4">
//               {error || "No antonym questions available"}
//             </p>
//             <button
//               onClick={() => {
//                 clearSession();
//                 window.location.reload();
//               }}
//               className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
//             >
//               Retry
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const currentAntonym = questions[currentQuestion];
//   const isLastQuestion = currentQuestion === questions.length - 1;

//   // ...existing code...

//   const resetExercise = async () => {
//     clearSession();
//     try {
//       setIsLoading(true);
//       const [lexiconData] = await Promise.all([getLexiconData()]);
//       const qs = await generateAntonymQuestionsFromService(
//         sessionExercises,
//         lexiconData,
//       );
//       setQuestions(qs);
//       setCurrentQuestion(0);
//       setSelectedAnswer(null);
//       setShowResult(false);
//       setAnswers(Array(qs.length).fill(null));
//       setDetailedAnswers([]);
//       setShowCompletion(false);
//     } catch (err) {
//       console.error("Failed to reload exercise:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // ...existing code...
//   return (
//     <div className="h-screen bg-yellow-50 overflow-auto flex flex-col scrollbar-yellow">
//       {/* ...existing code... */}
//       <button
//         onClick={resetExercise}
//         className="flex items-center gap-2 text-gray-600 hover:text-gray-700 font-semibold text-sm"
//       >
//         <RotateCcw className="w-4 h-4" />
//         <span className="hidden md:inline">Reset</span>
//       </button>
//       {/* ...existing code... */}
//     </div>
//   );
// }
