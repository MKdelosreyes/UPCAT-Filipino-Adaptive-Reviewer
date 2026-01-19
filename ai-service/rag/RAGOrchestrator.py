import json
import os
import numpy as np
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

from .grammar_rag import get_grammar_rag, GrammarRAG
from .vocabulary_rag import get_vocabulary_rag, VocabularyRAG
from .common_mistakes_rag import get_common_mistakes_rag, CommonMistakesRAG
from .embeddings import LocalEmbeddingModel, HybridSearcher


class ContextType(Enum):
    """Supported context types for retrieval"""
    VOCABULARY = "vocabulary"
    GRAMMAR = "grammar"
    GENERAL = "general"
    QUIZ = "quiz"
    ANTONYM = "antonym"
    FILL_BLANKS = "fill-blanks"
    ERROR_IDENTIFICATION = "error-identification"
    READING_COMPREHENSION = "reading-comprehension"
    SENTENCE_ORDERING = "sentence-ordering"
    CHOOSE_SENTENCE = "choose-sentence"


@dataclass
class ContextResponse:
    """Response from get_context that includes both formatted text and raw chunks"""
    formatted_context: str
    retrieved_chunks: List[Dict]
    retrieval_metadata: Dict


@dataclass
class RetrievalConfig:
    """Configuration for retrieval behavior"""
    top_k: int = 4
    min_similarity: float = 0.4  # Increased from 0.3
    use_hybrid: bool = True
    include_mistakes: bool = True
    include_strategies: bool = False
    boost_exact_match: bool = True
    include_examples: bool = True
    include_sources: bool = True
    max_context_length: int = 4000
    # NEW:  Relevance filtering options
    require_word_match: bool = True  # Only include results that mention the target word
    mistake_relevance_threshold: float = 0.6  # Higher threshold for mistakes
    prioritize_exact_vocabulary: bool = True  # Prioritize exact vocab matches


@dataclass
class RetrievalResult:
    """Structured result from retrieval"""
    source_type: str
    results: List[Dict]
    query: str
    relevance_scores: List[float] = field(default_factory=list)


class RAGOrchestrator:
    """
    Enhanced RAG Orchestrator with improved relevance filtering. 
    """

    def __init__(self):
        print("🚀 Initializing Enhanced RAG Orchestrator...")

        self.grammar_rag: GrammarRAG = get_grammar_rag()
        self.vocabulary_rag: VocabularyRAG = get_vocabulary_rag()
        self.common_mistakes_rag: CommonMistakesRAG = get_common_mistakes_rag()

        self.learning_strategies: List[Dict] = []
        self.strategy_embeddings: List[List[float]] = []
        self.embedder = LocalEmbeddingModel()
        self.hybrid_searcher = HybridSearcher(self.embedder)

        self._context_strategies = {
            ContextType.VOCABULARY: self._strategy_vocabulary,
            ContextType.GRAMMAR: self._strategy_grammar,
            ContextType.GENERAL: self._strategy_general,
            ContextType.QUIZ: self._strategy_quiz,
            ContextType.ANTONYM: self._strategy_antonym,
            ContextType.FILL_BLANKS: self._strategy_fill_blanks,
            ContextType.ERROR_IDENTIFICATION: self._strategy_error_identification,
            ContextType.READING_COMPREHENSION: self._strategy_reading_comprehension,
            ContextType.SENTENCE_ORDERING: self._strategy_sentence_ordering,
            ContextType.CHOOSE_SENTENCE: self._strategy_choose_sentence,
        }

        self._load_learning_strategies()
        print("✅ Enhanced RAG Orchestrator initialized successfully")

    def _load_learning_strategies(self) -> None:
        """Load learning strategies reference with embeddings"""
        try:
            strategies_path = os.path.join(
                os.path.dirname(__file__),
                "references",
                "learning_strategies.json"
            )

            if os.path.exists(strategies_path):
                with open(strategies_path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                for entry in data:
                    text_parts = [
                        f"Learning strategy: {entry.get('strategy_name', '')}",
                        f"Category: {entry.get('strategy_category', '')}",
                        f"Description: {entry.get('description', '')}",
                        f"Target skills: {', '.join(entry.get('target_skills', []))}",
                        f"Steps: {'; '.join(entry.get('step_by_step', []))}",
                        f"Difficulty: {entry.get('difficulty_level', '')}",
                    ]
                    entry["text"] = " | ".join(p for p in text_parts if p)
                    entry["searchable_text"] = " ".join([
                        entry.get("strategy_name", ""),
                        entry.get("description", ""),
                        " ".join(entry.get("target_skills", [])),
                        " ".join(entry.get("step_by_step", [])),
                    ])
                    self.learning_strategies.append(entry)

                if self.learning_strategies:
                    texts = [s["text"] for s in self.learning_strategies]
                    self.strategy_embeddings = self.embedder.embed_texts(texts)

                print(
                    f"✓ Loaded {len(self.learning_strategies)} learning strategies")
        except Exception as e:
            print(f"⚠️ Error loading learning strategies: {e}")

    # ==================== NEW:  Relevance Filtering Methods ====================

    def _build_enhanced_query(
        self,
        base_query: str,
        word: Optional[str] = None,
        sentence: Optional[str] = None,
        selected: Optional[str] = None,
        correct: Optional[str] = None,
        context_type: Optional[str] = None
    ) -> str:
        """
        Build an enhanced query by adding relevant context.

        This improves retrieval by making the query more specific
        and including related terms.
        """
        query_parts = [base_query]

        # Add word if provided
        if word:
            query_parts.append(f"salita: {word}")

        # Add sentence context if provided
        if sentence:
            # Truncate long sentences
            truncated = sentence[:200] if len(sentence) > 200 else sentence
            query_parts.append(f"pangungusap: {truncated}")

        # Add answer context for error analysis
        if selected and correct and selected != correct:
            query_parts.append(f"maling sagot: {selected}")
            query_parts.append(f"tamang sagot: {correct}")
        elif correct:
            query_parts.append(f"sagot: {correct}")

        # Add context type hints
        if context_type:
            type_hints = {
                "vocabulary": "kahulugan kasingkahulugan kasalungat",
                "grammar": "gramatika balarila pangungusap",
                "quiz": "pagsusulit kahulugan",
                "antonym": "kasalungat salungat",
                "fill-blanks": "puwang sagot pangungusap",
                "error-identification": "mali tama kamalian",
                "reading-comprehension": "pagbasa pag-unawa teksto",
                "sentence-ordering": "pagkakasunod-sunod ayos pangungusap",
                "choose-sentence": "pumili pangungusap konteksto",
            }
            if context_type in type_hints:
                query_parts.append(type_hints[context_type])

        enhanced_query = " ".join(query_parts)
        return enhanced_query

    def _extract_key_terms(self, text: str) -> List[str]:
        """
        Extract key terms from text for better retrieval.
        Removes common Filipino stop words.
        """
        if not text:
            return []

        # Common Filipino stop words
        stop_words = {
            'ang', 'ng', 'sa', 'mga', 'na', 'ay', 'at', 'para', 'kung',
            'dahil', 'ito', 'iyon', 'siya', 'ako', 'ka', 'niya', 'ko',
            'mo', 'namin', 'natin', 'nila', 'kanila', 'kanya', 'akin',
            'atin', 'amin', 'inyo', 'ninyo', 'ba', 'din', 'rin', 'lang',
            'lamang', 'pa', 'na', 'pero', 'ngunit', 'subalit', 'o', 'ni'
        }

        # Split and filter
        words = text.lower().split()
        key_terms = [w for w in words if len(w) > 2 and w not in stop_words]

        return key_terms[:10]  # Return max 10 key terms

    def _calculate_query_relevance(
        self,
        query: str,
        result: Dict,
        context_type: str
    ) -> float:
        """
        Calculate relevance score between query and result.
        """
        base_score = result.get("similarity_score", 0.0)

        # Boost for exact matches
        query_lower = query.lower()

        if context_type == "vocabulary":
            lemma = result.get("lemma", "").lower()
            if lemma and lemma in query_lower:
                base_score += 0.2
        elif context_type == "grammar":
            rule_name = result.get("rule_name", "").lower()
            if rule_name and any(term in query_lower for term in rule_name.split()):
                base_score += 0.15
        elif context_type == "mistakes":
            error_name = result.get("error_name", "").lower()
            if error_name and error_name in query_lower:
                base_score += 0.2

        return min(1.0, base_score)  # Cap at 1.0

    def _is_vocabulary_relevant(self, vocab_result: Dict, target_word: str, correct_answer: str = None, selected_answer: str = None) -> bool:
        """
        Check if a vocabulary result is actually relevant to the target word.
        """
        if not target_word:
            return True

        target_lower = target_word.lower().strip()
        lemma = vocab_result.get("lemma", "").lower().strip()

        # Direct lemma match - highly relevant
        if lemma == target_lower:
            return True

        # Check if target word is in synonyms
        synonyms = [s.lower() for s in vocab_result.get("synonyms", [])]
        if target_lower in synonyms:
            return True

        # Check if target word is in antonyms (relevant for antonym questions)
        antonyms = [a.lower() for a in vocab_result.get("antonyms", [])]
        if target_lower in antonyms:
            return True

        # Check if correct answer matches this vocab entry
        if correct_answer:
            correct_lower = correct_answer.lower().strip()
            if lemma == correct_lower or correct_lower in synonyms or correct_lower in antonyms:
                return True

        # Check definition for target word mention
        definition = vocab_result.get("definition", "").lower()
        if target_lower in definition:
            return True

        return False

    def _is_mistake_relevant(self, mistake_result: Dict, target_word: str, context_type: str, selected_answer: str = None, correct_answer: str = None) -> bool:
        """
        Check if a common mistake pattern is relevant to the current question.
        Only include mistakes that directly relate to the words/concepts being tested.
        """
        if not target_word:
            return False

        target_lower = target_word.lower().strip()

        # Check linguistic focus - this is the most important indicator
        linguistic_focus = [f.lower()
                            for f in mistake_result.get("linguistic_focus", [])]

        # Direct match with target word
        if target_lower in linguistic_focus:
            return True

        # Check if selected or correct answer is in linguistic focus
        if selected_answer and selected_answer.lower() in linguistic_focus:
            return True
        if correct_answer and correct_answer.lower() in linguistic_focus:
            return True

        # For vocabulary questions, only include vocabulary-related mistakes
        # that specifically mention the words involved
        if context_type in ["quiz", "antonym", "vocabulary"]:
            error_category = mistake_result.get("error_category", "").lower()
            if error_category != "vocabulary/usage":
                # Only include grammar mistakes if they're specifically about the words
                description = mistake_result.get("description", "").lower()
                if target_lower not in description:
                    return False

        # For grammar questions, check if the mistake type matches
        if context_type in ["fill-blanks", "error-identification", "grammar"]:
            error_category = mistake_result.get("error_category", "").lower()
            if "grammar" in error_category:
                # Check if any focus word appears in the question context
                if selected_answer:
                    for focus in linguistic_focus:
                        if focus in selected_answer.lower():
                            return True
                if correct_answer:
                    for focus in linguistic_focus:
                        if focus in correct_answer.lower():
                            return True

        return False

    def _filter_and_rank_results(
        self,
        results: List[Dict],
        source_type: str,
        target_word: str,
        context_type: str,
        selected_answer: str = None,
        correct_answer: str = None,
        config: RetrievalConfig = None
    ) -> List[Dict]:
        """
        Filter results to only include truly relevant content.
        """
        if config is None:
            config = RetrievalConfig()

        filtered = []

        for result in results:
            is_relevant = False
            relevance_boost = 0.0

            if source_type == "vocabulary":
                is_relevant = self._is_vocabulary_relevant(
                    result, target_word, correct_answer, selected_answer
                )
                # Boost exact matches
                if result.get("lemma", "").lower() == target_word.lower():
                    relevance_boost = 0.3
                elif correct_answer and result.get("lemma", "").lower() == correct_answer.lower():
                    relevance_boost = 0.25

            elif source_type == "mistakes":
                is_relevant = self._is_mistake_relevant(
                    result, target_word, context_type, selected_answer, correct_answer
                )
                # Only include if similarity is high enough
                if result.get("similarity_score", 0) < config.mistake_relevance_threshold:
                    is_relevant = False

            elif source_type == "grammar":
                # Grammar rules are generally relevant if similarity is decent
                is_relevant = result.get(
                    "similarity_score", 0) >= config.min_similarity

            else:
                is_relevant = True

            if is_relevant:
                # Apply relevance boost
                if relevance_boost > 0:
                    result["similarity_score"] = min(1.0, result.get(
                        "similarity_score", 0.5) + relevance_boost)
                result["relevance_verified"] = True
                filtered.append(result)

        # Sort by similarity score
        filtered.sort(key=lambda x: x.get("similarity_score", 0), reverse=True)

        return filtered

    # ==================== Updated Retrieval Strategies ====================

    def _strategy_vocabulary(
        self, query: str, config: RetrievalConfig,
        word: Optional[str], sentence: Optional[str],
        selected: Optional[str], correct: Optional[str]
    ) -> List[RetrievalResult]:
        """Strategy for vocabulary-focused retrieval with improved filtering"""
        results = []
        target_word = word or ""

        # Primary: Direct vocabulary lookup (exact match first)
        if word:
            exact_match = self.vocabulary_rag.get_by_lemma(word)
            if exact_match:
                exact_match["similarity_score"] = 1.0
                exact_match["match_type"] = "exact_lemma"
                results.append(RetrievalResult(
                    source_type="vocabulary",
                    results=[exact_match],
                    query=word,
                    relevance_scores=[1.0]
                ))

        # Also get the correct answer's vocabulary entry if different
        if correct and correct.lower() != (word or "").lower():
            correct_match = self.vocabulary_rag.get_by_lemma(correct)
            if correct_match:
                correct_match["similarity_score"] = 0.95
                correct_match["match_type"] = "correct_answer"
                results.append(RetrievalResult(
                    source_type="vocabulary",
                    results=[correct_match],
                    query=correct,
                    relevance_scores=[0.95]
                ))

        # Secondary: Semantic search for related vocabulary
        vocab_results = self.vocabulary_rag.search(
            query=word or query,
            top_k=config.top_k,
            min_similarity=config.min_similarity,
            use_hybrid=config.use_hybrid,
            boost_exact_match=config.boost_exact_match
        )

        # Filter to only include relevant results
        filtered_vocab = self._filter_and_rank_results(
            vocab_results, "vocabulary", target_word, "vocabulary",
            selected, correct, config
        )

        # Remove duplicates (already have exact matches)
        existing_lemmas = set()
        for rr in results:
            for r in rr.results:
                existing_lemmas.add(r.get("lemma", "").lower())

        filtered_vocab = [r for r in filtered_vocab if r.get(
            "lemma", "").lower() not in existing_lemmas]

        if filtered_vocab:
            results.append(RetrievalResult(
                source_type="vocabulary",
                results=filtered_vocab[: 2],  # Limit to top 2 additional
                query=query,
                relevance_scores=[r.get("similarity_score", 0)
                                  for r in filtered_vocab[:2]]
            ))

        # Tertiary: Common mistakes ONLY if directly relevant
        if config.include_mistakes and word:
            # First check if there's a direct linguistic focus match
            focus_matches = self.common_mistakes_rag.get_by_linguistic_focus(
                word)
            if focus_matches:
                for m in focus_matches:
                    m["similarity_score"] = 0.9
                    m["match_type"] = "linguistic_focus"
                results.append(RetrievalResult(
                    source_type="mistakes",
                    results=focus_matches[: 1],  # Only top 1
                    query=word,
                    relevance_scores=[0.9]
                ))

            # Also check for correct/selected answer focus
            if correct and correct.lower() != word.lower():
                correct_focus = self.common_mistakes_rag.get_by_linguistic_focus(
                    correct)
                if correct_focus:
                    for m in correct_focus:
                        m["similarity_score"] = 0.85
                    results.append(RetrievalResult(
                        source_type="mistakes",
                        results=correct_focus[: 1],
                        query=correct,
                        relevance_scores=[0.85]
                    ))

        return results

    def _strategy_quiz(
        self, query: str, config: RetrievalConfig,
        word: Optional[str], sentence: Optional[str],
        selected: Optional[str], correct: Optional[str]
    ) -> List[RetrievalResult]:
        """Strategy for quiz mode with strict relevance filtering"""
        results = []
        target_word = word or ""

        # Primary: Get the exact vocabulary entry for the word being tested
        if word:
            exact_match = self.vocabulary_rag.get_by_lemma(word)
            if exact_match:
                exact_match["similarity_score"] = 1.0
                exact_match["match_type"] = "exact_target"
                results.append(RetrievalResult(
                    source_type="vocabulary",
                    results=[exact_match],
                    query=word,
                    relevance_scores=[1.0]
                ))

        # Secondary: Get vocabulary entry for the correct answer (if it's a word)
        if correct:
            correct_vocab = self.vocabulary_rag.get_by_lemma(correct)
            if correct_vocab:
                correct_vocab["similarity_score"] = 0.95
                correct_vocab["match_type"] = "correct_answer"
                # Avoid duplicate
                existing = [r.get("lemma", "").lower()
                            for rr in results for r in rr.results]
                if correct_vocab.get("lemma", "").lower() not in existing:
                    results.append(RetrievalResult(
                        source_type="vocabulary",
                        results=[correct_vocab],
                        query=correct,
                        relevance_scores=[0.95]
                    ))

        # Tertiary: Only include mistakes if they directly involve the words
        if config.include_mistakes:
            # Check for confusion patterns between selected and correct
            if selected and correct and selected != correct:
                # Search for specific confusion pattern
                confusion_query = f"{word} {selected} {correct} confusion kahulugan"
                mistake_results = self.common_mistakes_rag.search(
                    query=confusion_query,
                    top_k=2,
                    min_similarity=0.5,
                    use_hybrid=True
                )

                # Filter to only truly relevant mistakes
                filtered_mistakes = self._filter_and_rank_results(
                    mistake_results, "mistakes", target_word, "quiz",
                    selected, correct, config
                )

                if filtered_mistakes:
                    results.append(RetrievalResult(
                        source_type="mistakes",
                        results=filtered_mistakes[: 1],
                        query=confusion_query,
                        relevance_scores=[r.get("similarity_score", 0)
                                          for r in filtered_mistakes[:1]]
                    ))

        return results

    def _strategy_antonym(
        self, query:  str, config: RetrievalConfig,
        word: Optional[str], sentence: Optional[str],
        selected: Optional[str], correct: Optional[str]
    ) -> List[RetrievalResult]:
        """Strategy for antonym questions with improved relevance"""
        results = []
        target_word = word or ""

        if word:
            # Primary: Get the word's vocabulary entry
            word_entry = self.vocabulary_rag.get_by_lemma(word)
            if word_entry:
                word_entry["similarity_score"] = 1.0
                word_entry["match_type"] = "target_word"
                results.append(RetrievalResult(
                    source_type="vocabulary",
                    results=[word_entry],
                    query=word,
                    relevance_scores=[1.0]
                ))

            # Secondary: Get the correct answer's entry (the actual antonym)
            if correct:
                correct_entry = self.vocabulary_rag.get_by_lemma(correct)
                if correct_entry:
                    correct_entry["similarity_score"] = 0.95
                    correct_entry["match_type"] = "correct_antonym"
                    correct_entry["relationship"] = f"antonym of {word}"
                    results.append(RetrievalResult(
                        source_type="vocabulary",
                        results=[correct_entry],
                        query=correct,
                        relevance_scores=[0.95]
                    ))

            # Tertiary: Check for entries that list the word as an antonym
            related_by_antonym = self.vocabulary_rag.get_antonyms_of(word)
            if related_by_antonym:
                for r in related_by_antonym[: 1]:
                    r["similarity_score"] = 0.85
                    r["relationship"] = "has_word_as_antonym"
                # Avoid duplicates
                existing = [r.get("lemma", "").lower()
                            for rr in results for r in rr.results]
                new_results = [r for r in related_by_antonym[: 1]
                               if r.get("lemma", "").lower() not in existing]
                if new_results:
                    results.append(RetrievalResult(
                        source_type="vocabulary",
                        results=new_results,
                        query=f"antonym of {word}",
                        relevance_scores=[0.85]
                    ))

        # Only include mistakes if specifically about synonym/antonym confusion
        # and involves the actual words in question
        if config.include_mistakes and selected and correct and selected != correct:
            # Only search for very specific patterns
            for focus_word in [word, selected, correct]:
                if focus_word:
                    focus_matches = self.common_mistakes_rag.get_by_linguistic_focus(
                        focus_word)
                    if focus_matches:
                        # Further filter to antonym/synonym related mistakes
                        relevant = [m for m in focus_matches if
                                    "antonym" in m.get("description", "").lower() or
                                    "synonym" in m.get("description", "").lower() or
                                    "kasalungat" in m.get("description", "").lower() or
                                    "kasingkahulugan" in m.get("description", "").lower()]
                        if relevant:
                            for m in relevant:
                                m["similarity_score"] = 0.8
                            results.append(RetrievalResult(
                                source_type="mistakes",
                                results=relevant[: 1],
                                query=focus_word,
                                relevance_scores=[0.8]
                            ))
                            break  # Only add one mistake pattern

        return results

    def _strategy_fill_blanks(
        self, query:  str, config: RetrievalConfig,
        word: Optional[str], sentence: Optional[str],
        selected: Optional[str], correct: Optional[str]
    ) -> List[RetrievalResult]:
        """Strategy for fill-in-the-blanks with focused grammar retrieval"""
        results = []

        # Primary: Check for direct linguistic focus matches (e.g., ng/nang, din/rin)
        if correct:
            focus_matches = self.common_mistakes_rag.get_by_linguistic_focus(
                correct)
            if focus_matches:
                for m in focus_matches:
                    m["similarity_score"] = 0.95
                    m["match_type"] = "linguistic_focus_correct"
                results.append(RetrievalResult(
                    source_type="mistakes",
                    results=focus_matches[:2],
                    query=correct,
                    relevance_scores=[0.95] * min(2, len(focus_matches))
                ))

        if selected and selected != correct:
            selected_focus = self.common_mistakes_rag.get_by_linguistic_focus(
                selected)
            if selected_focus:
                # Avoid duplicates
                existing_ids = [r.get("error_id")
                                for rr in results for r in rr.results]
                new_matches = [m for m in selected_focus if m.get(
                    "error_id") not in existing_ids]
                if new_matches:
                    for m in new_matches:
                        m["similarity_score"] = 0.9
                        m["match_type"] = "linguistic_focus_selected"
                    results.append(RetrievalResult(
                        source_type="mistakes",
                        results=new_matches[: 1],
                        query=selected,
                        relevance_scores=[0.9]
                    ))

        # Secondary: Grammar rules relevant to the sentence structure
        if sentence or correct:
            grammar_query = f"Filipino grammar:  {correct or ''}"
            if sentence:
                grammar_query += f" in context: {sentence[: 100]}"

            grammar_results = self.grammar_rag.search(
                query=grammar_query,
                top_k=2,
                min_similarity=config.min_similarity,
                use_hybrid=config.use_hybrid
            )
            if grammar_results:
                results.append(RetrievalResult(
                    source_type="grammar",
                    results=grammar_results[:2],
                    query=grammar_query,
                    relevance_scores=[r.get("similarity_score", 0)
                                      for r in grammar_results[:2]]
                ))

        return results

    def _strategy_error_identification(
        self, query: str, config: RetrievalConfig,
        word: Optional[str], sentence: Optional[str],
        selected: Optional[str], correct: Optional[str]
    ) -> List[RetrievalResult]:
        """Strategy for error identification with mistake-focused retrieval"""
        results = []

        # Primary: Direct linguistic focus search for the correct answer (the actual error)
        if correct and correct.lower() != "walang mali":
            focus_matches = self.common_mistakes_rag.get_by_linguistic_focus(
                correct)
            if focus_matches:
                for m in focus_matches:
                    m["similarity_score"] = 0.95
                    m["match_type"] = "direct_error_match"
                results.append(RetrievalResult(
                    source_type="mistakes",
                    results=focus_matches[:2],
                    query=correct,
                    relevance_scores=[0.95] * min(2, len(focus_matches))
                ))

            # Also search semantically for error patterns
            error_query = f"Filipino error: {correct}"
            if sentence:
                error_query += f" in:  {sentence[:100]}"

            mistake_results = self.common_mistakes_rag.search(
                query=error_query,
                top_k=2,
                min_similarity=0.5,
                use_hybrid=True
            )

            # Filter and deduplicate
            existing_ids = [r.get("error_id")
                            for rr in results for r in rr.results]
            new_mistakes = [m for m in mistake_results if m.get(
                "error_id") not in existing_ids]

            # Further filter for relevance
            filtered = self._filter_and_rank_results(
                new_mistakes, "mistakes", correct, "error-identification",
                selected, correct, config
            )

            if filtered:
                results.append(RetrievalResult(
                    source_type="mistakes",
                    results=filtered[:1],
                    query=error_query,
                    relevance_scores=[r.get("similarity_score", 0)
                                      for r in filtered[:1]]
                ))

        # Secondary: Grammar rules explaining the error
        grammar_query = f"Filipino grammar rule: {correct or query}"
        grammar_results = self.grammar_rag.search(
            query=grammar_query,
            top_k=2,
            min_similarity=config.min_similarity,
            use_hybrid=config.use_hybrid
        )
        if grammar_results:
            results.append(RetrievalResult(
                source_type="grammar",
                results=grammar_results[:2],
                query=grammar_query,
                relevance_scores=[r.get("similarity_score", 0)
                                  for r in grammar_results[:2]]
            ))

        return results

    def _strategy_grammar(
        self, query: str, config: RetrievalConfig,
        word: Optional[str], sentence: Optional[str],
        selected: Optional[str], correct:  Optional[str]
    ) -> List[RetrievalResult]:
        """Strategy for grammar-focused retrieval"""
        results = []

        grammar_query = query
        if sentence:
            grammar_query = f"Filipino grammar: {sentence}. Focus:  {word or query}"

        # Primary: Grammar rules
        grammar_results = self.grammar_rag.search(
            query=grammar_query,
            top_k=config.top_k,
            min_similarity=config.min_similarity,
            use_hybrid=config.use_hybrid
        )
        if grammar_results:
            results.append(RetrievalResult(
                source_type="grammar",
                results=grammar_results,
                query=grammar_query,
                relevance_scores=[r.get("similarity_score", 0)
                                  for r in grammar_results]
            ))

        # Secondary: Only relevant grammar mistakes
        if config.include_mistakes:
            # Check for direct linguistic focus first
            if word:
                focus_matches = self.common_mistakes_rag.get_by_linguistic_focus(
                    word)
                if focus_matches:
                    for m in focus_matches:
                        m["similarity_score"] = 0.9
                    results.append(RetrievalResult(
                        source_type="mistakes",
                        results=focus_matches[: 1],
                        query=word,
                        relevance_scores=[0.9]
                    ))

        return results

    def _strategy_reading_comprehension(
        self, query: str, config: RetrievalConfig,
        word:  Optional[str], sentence: Optional[str],
        selected: Optional[str], correct: Optional[str]
    ) -> List[RetrievalResult]:
        """Strategy for reading comprehension - focus on vocabulary understanding"""
        results = []

        reading_query = query
        if word:
            reading_query = f"Reading comprehension: {word}"

        # Primary: Vocabulary for key terms
        vocab_results = self.vocabulary_rag.search(
            query=reading_query,
            top_k=config.top_k,
            min_similarity=config.min_similarity * 0.8,
            use_hybrid=config.use_hybrid,
            boost_exact_match=True
        )

        if vocab_results:
            results.append(RetrievalResult(
                source_type="vocabulary",
                results=vocab_results[: 3],
                query=reading_query,
                relevance_scores=[r.get("similarity_score", 0)
                                  for r in vocab_results[:3]]
            ))

        # Secondary: Grammar for sentence understanding (minimal)
        grammar_results = self.grammar_rag.search(
            query=reading_query,
            top_k=1,
            min_similarity=config.min_similarity,
            use_hybrid=config.use_hybrid
        )
        if grammar_results:
            results.append(RetrievalResult(
                source_type="grammar",
                results=grammar_results[:1],
                query=reading_query,
                relevance_scores=[r.get("similarity_score", 0)
                                  for r in grammar_results[:1]]
            ))

        # NO common mistakes for reading comprehension unless very specific
        return results

    def _strategy_sentence_ordering(
        self, query: str, config: RetrievalConfig,
        word: Optional[str], sentence: Optional[str],
        selected: Optional[str], correct: Optional[str]
    ) -> List[RetrievalResult]:
        """Strategy for sentence ordering - focus on word order rules"""
        results = []

        ordering_query = "Filipino sentence structure word order syntax basic word order"

        # Primary: Grammar rules about word order
        grammar_results = self.grammar_rag.search(
            query=ordering_query,
            top_k=config.top_k,
            min_similarity=config.min_similarity * 0.5,
            use_hybrid=config.use_hybrid
        )
        if grammar_results:
            results.append(RetrievalResult(
                source_type="grammar",
                results=grammar_results[: 3],
                query=ordering_query,
                relevance_scores=[r.get("similarity_score", 0)
                                  for r in grammar_results[:3]]
            ))

        # Only include vocabulary if there are specific difficult words
        if correct:
            words = correct.split()
            content_words = [w for w in words if len(w) > 4 and w.lower() not in
                             ['ang', 'ng', 'sa', 'mga', 'na', 'ay', 'at', 'para', 'kung', 'dahil', 'siya', 'niya']]

            for cw in content_words[: 2]:
                vocab_match = self.vocabulary_rag.get_by_lemma(cw)
                if vocab_match:
                    vocab_match["similarity_score"] = 0.7
                    results.append(RetrievalResult(
                        source_type="vocabulary",
                        results=[vocab_match],
                        query=cw,
                        relevance_scores=[0.7]
                    ))
                    break

        return results

    def _strategy_choose_sentence(
        self, query: str, config: RetrievalConfig,
        word: Optional[str], sentence: Optional[str],
        selected: Optional[str], correct: Optional[str]
    ) -> List[RetrievalResult]:
        """Strategy for choose-the-best-sentence"""
        results = []

        choose_query = "Filipino sentence construction coherence context"

        # Primary: Grammar rules
        grammar_results = self.grammar_rag.search(
            query=choose_query,
            top_k=2,
            min_similarity=config.min_similarity * 0.5,
            use_hybrid=config.use_hybrid
        )
        if grammar_results:
            results.append(RetrievalResult(
                source_type="grammar",
                results=grammar_results[: 2],
                query=choose_query,
                relevance_scores=[r.get("similarity_score", 0)
                                  for r in grammar_results[:2]]
            ))

        # Secondary: Key vocabulary from the correct sentence
        if correct:
            words = correct.split()
            content_words = [w for w in words if len(w) > 4 and w.lower() not in
                             ['ang', 'ng', 'sa', 'mga', 'na', 'ay', 'at', 'para', 'kung', 'dahil']]

            for cw in content_words[: 2]:
                vocab_match = self.vocabulary_rag.get_by_lemma(cw)
                if vocab_match:
                    vocab_match["similarity_score"] = 0.75
                    results.append(RetrievalResult(
                        source_type="vocabulary",
                        results=[vocab_match],
                        query=cw,
                        relevance_scores=[0.75]
                    ))
                    break

        return results

    def _strategy_general(
        self, query: str, config: RetrievalConfig,
        word: Optional[str], sentence: Optional[str],
        selected: Optional[str], correct:  Optional[str]
    ) -> List[RetrievalResult]:
        """General strategy with balanced retrieval"""
        results = []

        # Vocabulary
        vocab_results = self.vocabulary_rag.search(
            query=query,
            top_k=2,
            min_similarity=config.min_similarity,
            use_hybrid=config.use_hybrid
        )
        if vocab_results:
            results.append(RetrievalResult(
                source_type="vocabulary",
                results=vocab_results,
                query=query,
                relevance_scores=[r.get("similarity_score", 0)
                                  for r in vocab_results]
            ))

        # Grammar
        grammar_results = self.grammar_rag.search(
            query=query,
            top_k=2,
            min_similarity=config.min_similarity,
            use_hybrid=config.use_hybrid
        )
        if grammar_results:
            results.append(RetrievalResult(
                source_type="grammar",
                results=grammar_results,
                query=query,
                relevance_scores=[r.get("similarity_score", 0)
                                  for r in grammar_results]
            ))

        return results

    # ==================== Result Processing ====================

    def _merge_and_rank_results(
        self,
        retrieval_results: List[RetrievalResult],
        config: RetrievalConfig
    ) -> List[Tuple[str, Dict, float]]:
        """Merge, deduplicate, and rank results"""
        all_results:  List[Tuple[str, Dict, float]] = []

        source_weights = {
            "vocabulary": 1.0,
            "grammar": 1.0,
            "mistakes": 0.9,  # Slightly lower since we're being more selective
            "strategies": 0.8
        }

        match_boosts = {
            "exact_lemma": 0.25,
            "exact_target": 0.25,
            "correct_answer": 0.2,
            "correct_antonym": 0.2,
            "linguistic_focus":  0.15,
            "linguistic_focus_correct": 0.15,
            "linguistic_focus_selected": 0.1,
            "direct_error_match": 0.15,
            "target_word": 0.15,
            "has_word_as_antonym": 0.1,
            "hybrid":  0.0,
            "semantic": -0.05
        }

        for rr in retrieval_results:
            source_weight = source_weights.get(rr.source_type, 1.0)

            for result in rr.results:
                base_score = result.get("similarity_score", 0.5)
                match_type = result.get("match_type", "semantic")
                match_boost = match_boosts.get(match_type, 0.0)

                final_score = (base_score + match_boost) * source_weight
                final_score = min(1.0, max(0.0, final_score))

                all_results.append((rr.source_type, result, final_score))

        # Sort by score
        all_results.sort(key=lambda x: x[2], reverse=True)

        # Deduplicate
        seen_ids = set()
        deduplicated = []

        for source_type, result, score in all_results:
            if source_type == "vocabulary":
                unique_id = f"vocab_{result.get('lemma', '')}"
            elif source_type == "grammar":
                unique_id = f"grammar_{result.get('rule_name', '')}"
            elif source_type == "mistakes":
                unique_id = f"mistake_{result.get('error_id', '')}"
            else:
                unique_id = f"{source_type}_{result.get('chunk_id', id(result))}"

            if unique_id not in seen_ids:
                seen_ids.add(unique_id)
                deduplicated.append((source_type, result, score))

        return deduplicated

    def _format_final_context(
        self,
        merged_results: List[Tuple[str, Dict, float]],
        config: RetrievalConfig
    ) -> str:
        """Format merged results into context string"""
        if not merged_results:
            return ""

        sections = {
            "vocabulary": [],
            "grammar": [],
            "mistakes": [],
            "strategies": []
        }

        for source_type, result, score in merged_results:
            sections[source_type].append((result, score))

        context_parts = []

        if sections["vocabulary"]:
            vocab_context = self._format_vocabulary_section(
                sections["vocabulary"], config)
            if vocab_context:
                context_parts.append(vocab_context)

        if sections["grammar"]:
            grammar_context = self._format_grammar_section(
                sections["grammar"], config)
            if grammar_context:
                context_parts.append(grammar_context)

        if sections["mistakes"]:
            mistakes_context = self._format_mistakes_section(
                sections["mistakes"], config)
            if mistakes_context:
                context_parts.append(mistakes_context)

        if sections["strategies"]:
            strategies_context = self._format_strategies_section(
                sections["strategies"], config)
            if strategies_context:
                context_parts.append(strategies_context)

        return "\n\n".join(context_parts)

    def _format_vocabulary_section(self, results: List[Tuple[Dict, float]], config: RetrievalConfig) -> str:
        if not results:
            return ""

        lines = ["[VOCABULARY REFERENCE]"]

        for i, (r, score) in enumerate(results[: config.top_k], 1):
            lines.append(
                f"\n{i}. {r.get('lemma', 'N/A')} ({r.get('part_of_speech', '')})")
            lines.append(f"   Definition: {r.get('definition', 'N/A')}")

            if r.get("usage"):
                lines.append(f"   Usage: {r['usage'][: 150]}...")

            if config.include_examples and r.get("example"):
                gloss = f" ({r.get('example_gloss', '')})" if r.get(
                    'example_gloss') else ""
                lines.append(f"   Example: \"{r['example']}\"{gloss}")

            if r.get("synonyms"):
                lines.append(f"   Synonyms: {', '.join(r['synonyms'][:5])}")

            if r.get("antonyms"):
                lines.append(f"   Antonyms: {', '.join(r['antonyms'][:5])}")

        return "\n".join(lines)

    def _format_grammar_section(self, results: List[Tuple[Dict, float]], config: RetrievalConfig) -> str:
        if not results:
            return ""

        lines = ["[GRAMMAR RULES]"]

        for i, (r, score) in enumerate(results[:config.top_k], 1):
            lines.append(
                f"\n{i}. {r.get('rule_name', 'N/A')} ({r.get('section', '')})")
            lines.append(f"   {r.get('description', 'N/A')}")

            if r.get("common_errors"):
                lines.append(f"   Common error: {r['common_errors']}")

            if config.include_examples and r.get("examples"):
                lines.append("   Examples:")
                for ex in r["examples"][:2]:
                    if isinstance(ex, dict):
                        ex_str = " → ".join(f"{k}: {v}" for k, v in ex.items())
                        lines.append(f"      • {ex_str}")
                    else:
                        lines.append(f"      • {ex}")

        return "\n".join(lines)

    def _format_mistakes_section(self, results: List[Tuple[Dict, float]], config: RetrievalConfig) -> str:
        if not results:
            return ""

        lines = ["[COMMON MISTAKE PATTERNS]"]

        # Limit to 2 mistakes max
        for i, (r, score) in enumerate(results[:2], 1):
            lines.append(
                f"\n{i}. {r.get('error_name', 'N/A')} ({r.get('error_category', '')})")
            lines.append(f"   {r.get('description', 'N/A')}")

            if r.get("why_it_occurs"):
                lines.append("   Why it occurs:")
                for reason in r["why_it_occurs"][:2]:
                    lines.append(f"      • {reason}")

            examples = r.get("examples", {})
            if examples.get("incorrect") and examples.get("correct"):
                lines.append(f"   Incorrect: {examples['incorrect'][0]}")
                lines.append(f"   Correct: {examples['correct'][0]}")

            if examples.get("explanation"):
                lines.append(f"   Explanation: {examples['explanation']}")

            rule = r.get("grammar_rule", {})
            if rule.get("rule_statement"):
                lines.append(f"   Rule: {rule['rule_statement']}")

        return "\n".join(lines)

    def _format_strategies_section(self, results: List[Tuple[Dict, float]], config: RetrievalConfig) -> str:
        if not results:
            return ""

        lines = ["[LEARNING STRATEGIES]"]

        for i, (r, score) in enumerate(results[:2], 1):
            lines.append(f"\n{i}. {r.get('strategy_name', 'N/A')}")
            lines.append(f"   {r.get('description', 'N/A')}")

        return "\n".join(lines)

    def _truncate_context(self, context: str, max_length: int) -> str:
        if len(context) <= max_length:
            return context

        sections = context.split("\n\n")
        truncated = []
        current_length = 0

        for section in sections:
            if current_length + len(section) + 2 <= max_length - 50:
                truncated.append(section)
                current_length += len(section) + 2
            else:
                break

        result = "\n\n".join(truncated)
        if len(result) < len(context):
            result += "\n\n[...  truncated ...]"

        return result

    def get_context(
        self,
        query: str,
        context_type: str = "general",
        config: Optional[RetrievalConfig] = None,
        word: Optional[str] = None,
        sentence: Optional[str] = None,
        selected_answer: Optional[str] = None,
        correct_answer: Optional[str] = None,
        return_chunks: bool = False,
        **kwargs
    ):
        """Main entry point for getting RAG context."""
        if config is None:
            config = RetrievalConfig(
                top_k=kwargs.get("top_k", 4),
                min_similarity=kwargs.get("min_similarity", 0.4),
                use_hybrid=kwargs.get("use_hybrid", True),
                include_mistakes=kwargs.get("include_mistakes", True),
                include_strategies=kwargs.get("include_strategies", False),
                boost_exact_match=kwargs.get("boost_exact_match", True),
                include_examples=kwargs.get("include_examples", True),
                include_sources=kwargs.get("include_sources", True),
                max_context_length=kwargs.get("max_context_length", 4000)
            )

        enhanced_query = self._build_enhanced_query(
            base_query=query,
            word=word,
            sentence=sentence,
            selected=selected_answer,
            correct=correct_answer,
            context_type=context_type
        )

        try:
            ctx_type = ContextType(context_type.lower())
        except ValueError:
            ctx_type = ContextType.GENERAL

        strategy_fn = self._context_strategies.get(
            ctx_type, self._strategy_general)
        retrieval_results = strategy_fn(
            enhanced_query, config, word, sentence, selected_answer, correct_answer
        )

        merged_results = self._merge_and_rank_results(
            retrieval_results, config)
        context = self._format_final_context(merged_results, config)

        if len(context) > config.max_context_length:
            context = self._truncate_context(
                context, config.max_context_length)

        if return_chunks:
            retrieved_chunks = []
            for source_type, result, score in merged_results:
                chunk = {
                    "source_type": source_type,
                    "content": result,
                    "relevance_score": score
                }
                retrieved_chunks.append(chunk)

            metadata = {
                "total_chunks": len(retrieved_chunks),
                "sources": list(set(c["source_type"] for c in retrieved_chunks)),
                "avg_relevance":  sum(c["relevance_score"] for c in retrieved_chunks) / len(retrieved_chunks) if retrieved_chunks else 0,
                "query": enhanced_query,
                "context_type": context_type
            }

            return ContextResponse(
                formatted_context=context,
                retrieved_chunks=retrieved_chunks,
                retrieval_metadata=metadata
            )

        return context


_orchestrator:  Optional[RAGOrchestrator] = None


def get_rag_orchestrator() -> RAGOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = RAGOrchestrator()
    return _orchestrator
