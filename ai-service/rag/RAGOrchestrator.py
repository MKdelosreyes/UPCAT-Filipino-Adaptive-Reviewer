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
    top_k: int = 3
    min_similarity: float = 0.3
    use_hybrid: bool = True
    include_mistakes: bool = True
    include_strategies: bool = False
    boost_exact_match: bool = True
    include_examples: bool = True
    include_sources: bool = True
    max_context_length: int = 4000  # Character limit for context


@dataclass
class RetrievalResult:
    """Structured result from retrieval"""
    source_type: str  # "vocabulary", "grammar", "mistakes", "strategies"
    results: List[Dict]
    query: str
    relevance_scores: List[float] = field(default_factory=list)


class RAGOrchestrator:
    """
    Unified RAG interface that combines grammar, vocabulary, and common mistakes
    retrieval with intelligent context merging, ranking, and deduplication.
    """

    def __init__(self):
        print("🚀 Initializing Enhanced RAG Orchestrator...")

        self.grammar_rag: GrammarRAG = get_grammar_rag()
        self.vocabulary_rag: VocabularyRAG = get_vocabulary_rag()
        self.common_mistakes_rag: CommonMistakesRAG = get_common_mistakes_rag()

        # Learning strategies
        self.learning_strategies: List[Dict] = []
        self.strategy_embeddings: List[List[float]] = []
        self.embedder = LocalEmbeddingModel()
        self.hybrid_searcher = HybridSearcher(self.embedder)

        # Context type to retrieval strategy mapping
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
                    # Create enriched searchable text
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

    def get_context(
        self,
        query:  str,
        context_type:  str = "general",
        config:  Optional[RetrievalConfig] = None,
        word:  Optional[str] = None,
        sentence: Optional[str] = None,
        selected_answer: Optional[str] = None,
        correct_answer:  Optional[str] = None,
        return_chunks: bool = False,
        **kwargs
    ) -> str:
        """
        Main entry point for getting RAG context.

        Args:
            query: The search query
            context_type:  One of "vocabulary", "grammar", "general", "quiz", "antonym", 
                         "fill-blanks", "error-identification"
            config:  Retrieval configuration
            word:  The specific word being queried (for vocabulary/quiz modes)
            sentence: The sentence context (for grammar modes)
            selected_answer: What the student selected (for mistake analysis)
            correct_answer: The correct answer (for mistake analysis)
            **kwargs: Additional parameters

        Returns:
            Formatted context string for LLM prompt
        """
        if config is None:
            config = RetrievalConfig(
                top_k=kwargs.get("top_k", 3),
                min_similarity=kwargs.get("min_similarity", 0.3),
                use_hybrid=kwargs.get("use_hybrid", True),
                include_mistakes=kwargs.get("include_mistakes", True),
                include_strategies=kwargs.get("include_strategies", False),
                boost_exact_match=kwargs.get("boost_exact_match", True),
                include_examples=kwargs.get("include_examples", True),
                include_sources=kwargs.get("include_sources", True),
                max_context_length=kwargs.get("max_context_length", 4000)
            )

        # Build enhanced query with additional context
        enhanced_query = self._build_enhanced_query(
            query=query,
            word=word,
            sentence=sentence,
            selected_answer=selected_answer,
            correct_answer=correct_answer
        )

        # Get context type enum
        try:
            ctx_type = ContextType(context_type.lower())
        except ValueError:
            ctx_type = ContextType.GENERAL

        # Execute retrieval strategy
        strategy_fn = self._context_strategies.get(
            ctx_type, self._strategy_general)
        retrieval_results = strategy_fn(
            enhanced_query, config, word, sentence, selected_answer, correct_answer)

        # Merge, deduplicate, and rank results
        merged_results = self._merge_and_rank_results(
            retrieval_results, config)

        # Format final context
        context = self._format_final_context(merged_results, config)

        # Truncate if necessary
        if len(context) > config.max_context_length:
            context = self._truncate_context(
                context, config.max_context_length)

        # Return with chunks if requested
        if return_chunks:
            # Extract raw chunks
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
                "avg_relevance": sum(c["relevance_score"] for c in retrieved_chunks) / len(retrieved_chunks) if retrieved_chunks else 0,
                "query": enhanced_query,
                "context_type": context_type
            }

            return ContextResponse(
                formatted_context=context,
                retrieved_chunks=retrieved_chunks,
                retrieval_metadata=metadata
            )

        return context

    def _build_enhanced_query(
        self,
        query: str,
        word: Optional[str] = None,
        sentence:  Optional[str] = None,
        selected_answer: Optional[str] = None,
        correct_answer: Optional[str] = None
    ) -> str:
        """Build an enhanced query with additional context"""
        parts = [query]

        if word:
            parts.append(f"Filipino word: {word}")
        if sentence:
            parts.append(f"Sentence: {sentence}")
        if selected_answer:
            parts.append(f"Student selected: {selected_answer}")
        if correct_answer:
            parts.append(f"Correct answer: {correct_answer}")

        return " | ".join(parts)

    # ==================== Retrieval Strategies ====================

    def _strategy_vocabulary(
        self, query: str, config: RetrievalConfig,
        word: Optional[str], sentence: Optional[str],
        selected:  Optional[str], correct: Optional[str]
    ) -> List[RetrievalResult]:
        """Strategy for vocabulary-focused retrieval"""
        results = []

        # Primary:  Vocabulary search
        vocab_results = self.vocabulary_rag.search(
            query=word or query,
            top_k=config.top_k,
            min_similarity=config.min_similarity,
            use_hybrid=config.use_hybrid,
            boost_exact_match=config.boost_exact_match
        )
        if vocab_results:
            results.append(RetrievalResult(
                source_type="vocabulary",
                results=vocab_results,
                query=query,
                relevance_scores=[r.get("similarity_score", 0)
                                  for r in vocab_results]
            ))

        # Secondary: Common mistakes related to vocabulary
        if config.include_mistakes:
            mistake_results = self.common_mistakes_rag.search(
                query=query,
                top_k=2,
                min_similarity=config.min_similarity,
                filter_category="vocabulary"
            )
            if mistake_results:
                results.append(RetrievalResult(
                    source_type="mistakes",
                    results=mistake_results,
                    query=query,
                    relevance_scores=[r.get("similarity_score", 0)
                                      for r in mistake_results]
                ))

        return results

    def _strategy_grammar(
        self, query: str, config: RetrievalConfig,
        word: Optional[str], sentence: Optional[str],
        selected: Optional[str], correct: Optional[str]
    ) -> List[RetrievalResult]:
        """Strategy for grammar-focused retrieval"""
        results = []

        # Build grammar-specific query
        grammar_query = query
        if sentence:
            grammar_query = f"Filipino grammar: {sentence}.  Focus:  {word or query}"

        # Primary:  Grammar rules
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

        # Secondary: Common grammar mistakes
        if config.include_mistakes:
            mistake_results = self.common_mistakes_rag.search(
                query=grammar_query,
                top_k=2,
                min_similarity=config.min_similarity,
                filter_category="grammar"
            )
            if mistake_results:
                results.append(RetrievalResult(
                    source_type="mistakes",
                    results=mistake_results,
                    query=grammar_query,
                    relevance_scores=[r.get("similarity_score", 0)
                                      for r in mistake_results]
                ))

        return results

    def _strategy_reading_comprehension(
        self, query: str, config: RetrievalConfig,
        word: Optional[str], sentence: Optional[str],
        selected: Optional[str], correct: Optional[str]
    ) -> List[RetrievalResult]:
        """Strategy for reading comprehension questions"""
        results = []

        # Build reading-focused query
        reading_query = query
        if word:  # word contains the question
            reading_query = f"Reading comprehension question: {word}"
        if sentence:  # sentence contains passage title or context
            reading_query += f" Context: {sentence}"

        # Primary: Vocabulary for key terms in the question/passage
        vocab_results = self.vocabulary_rag.search(
            query=reading_query,
            top_k=config.top_k,
            min_similarity=config.min_similarity * 0.8,  # Lower threshold
            use_hybrid=config.use_hybrid,
            boost_exact_match=config.boost_exact_match
        )
        if vocab_results:
            results.append(RetrievalResult(
                source_type="vocabulary",
                results=vocab_results,
                query=reading_query,
                relevance_scores=[r.get("similarity_score", 0)
                                  for r in vocab_results]
            ))

        # Secondary: Grammar rules for sentence understanding
        grammar_results = self.grammar_rag.search(
            query=reading_query,
            top_k=2,
            min_similarity=config.min_similarity * 0.7,
            use_hybrid=config.use_hybrid
        )
        if grammar_results:
            results.append(RetrievalResult(
                source_type="grammar",
                results=grammar_results,
                query=reading_query,
                relevance_scores=[r.get("similarity_score", 0)
                                  for r in grammar_results]
            ))

        return results

    def _strategy_sentence_ordering(
        self, query: str, config: RetrievalConfig,
        word: Optional[str], sentence: Optional[str],
        selected: Optional[str], correct: Optional[str]
    ) -> List[RetrievalResult]:
        """Strategy for sentence ordering exercises"""
        results = []

        # Build sentence-ordering focused query
        ordering_query = "Filipino sentence structure word order syntax"
        if correct:
            ordering_query += f" Correct sentence: {correct}"
        if selected:
            ordering_query += f" Student arrangement: {selected}"

        # Primary: Grammar rules about word order and sentence structure
        grammar_results = self.grammar_rag.search(
            query=ordering_query,
            top_k=config.top_k,
            # Lower threshold for broader matches
            min_similarity=config.min_similarity * 0.6,
            use_hybrid=config.use_hybrid
        )
        if grammar_results:
            results.append(RetrievalResult(
                source_type="grammar",
                results=grammar_results,
                query=ordering_query,
                relevance_scores=[r.get("similarity_score", 0)
                                  for r in grammar_results]
            ))

        # Secondary: Common mistakes in sentence construction
        if config.include_mistakes:
            mistake_query = "sentence structure word order error Filipino"
            if selected and correct and selected != correct:
                mistake_query += f" incorrect arrangement"

            mistake_results = self.common_mistakes_rag.search(
                query=mistake_query,
                top_k=2,
                min_similarity=config.min_similarity * 0.5,
                use_hybrid=config.use_hybrid
            )
            if mistake_results:
                results.append(RetrievalResult(
                    source_type="mistakes",
                    results=mistake_results,
                    query=mistake_query,
                    relevance_scores=[r.get("similarity_score", 0)
                                      for r in mistake_results]
                ))

        # Tertiary: Vocabulary for key words in the sentence
        if correct:
            # Extract key content words from the correct sentence
            words = correct.split()
            content_words = [w for w in words if len(w) > 3 and w.lower() not in
                             ['ang', 'ng', 'sa', 'mga', 'na', 'ay', 'at', 'para', 'kung', 'dahil']]

            if content_words:
                # Use first 3 content words
                vocab_query = " ".join(content_words[:3])
                vocab_results = self.vocabulary_rag.search(
                    query=vocab_query,
                    top_k=2,
                    min_similarity=config.min_similarity * 0.5,
                    use_hybrid=config.use_hybrid
                )
                if vocab_results:
                    results.append(RetrievalResult(
                        source_type="vocabulary",
                        results=vocab_results,
                        query=vocab_query,
                        relevance_scores=[r.get("similarity_score", 0)
                                          for r in vocab_results]
                    ))

        return results

    def _strategy_choose_sentence(
        self, query: str, config: RetrievalConfig,
        word: Optional[str], sentence: Optional[str],
        selected: Optional[str], correct: Optional[str]
    ) -> List[RetrievalResult]:
        """Strategy for choose-the-best-sentence exercises"""
        results = []

        # Build context-aware query
        choose_query = "Filipino sentence construction context clues coherence"
        if sentence:  # sentence contains the context
            choose_query += f" Context: {sentence}"
        if correct:
            choose_query += f" Best sentence: {correct}"

        # Primary: Grammar rules about sentence construction and coherence
        grammar_results = self.grammar_rag.search(
            query=choose_query,
            top_k=config.top_k,
            min_similarity=config.min_similarity * 0.6,
            use_hybrid=config.use_hybrid
        )
        if grammar_results:
            results.append(RetrievalResult(
                source_type="grammar",
                results=grammar_results,
                query=choose_query,
                relevance_scores=[r.get("similarity_score", 0)
                                  for r in grammar_results]
            ))

        # Secondary: Vocabulary for key terms (helps explain why certain words fit context)
        if correct:
            # Extract key words from correct sentence
            words = correct.split()
            content_words = [w for w in words if len(w) > 3 and w.lower() not in
                             ['ang', 'ng', 'sa', 'mga', 'na', 'ay', 'at', 'para', 'kung', 'dahil']]

            if content_words:
                vocab_query = " ".join(content_words[:3])
                vocab_results = self.vocabulary_rag.search(
                    query=vocab_query,
                    top_k=2,
                    min_similarity=config.min_similarity * 0.5,
                    use_hybrid=config.use_hybrid
                )
                if vocab_results:
                    results.append(RetrievalResult(
                        source_type="vocabulary",
                        results=vocab_results,
                        query=vocab_query,
                        relevance_scores=[r.get("similarity_score", 0)
                                          for r in vocab_results]
                    ))

        # Tertiary: Common mistakes in sentence selection
        if config.include_mistakes:
            if selected and correct and selected != correct:
                mistake_query = f"sentence selection error context clues"
                mistake_results = self.common_mistakes_rag.search(
                    query=mistake_query,
                    top_k=2,
                    min_similarity=config.min_similarity * 0.5,
                    use_hybrid=config.use_hybrid
                )
                if mistake_results:
                    results.append(RetrievalResult(
                        source_type="mistakes",
                        results=mistake_results,
                        query=mistake_query,
                        relevance_scores=[r.get("similarity_score", 0)
                                          for r in mistake_results]
                    ))

        return results

    def _strategy_general(
        self, query: str, config: RetrievalConfig,
        word: Optional[str], sentence: Optional[str],
        selected: Optional[str], correct: Optional[str]
    ) -> List[RetrievalResult]:
        """Strategy for general retrieval (combines vocabulary and grammar)"""
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

        # Mistakes
        if config.include_mistakes:
            mistake_results = self.common_mistakes_rag.search(
                query=query,
                top_k=1,
                min_similarity=config.min_similarity
            )
            if mistake_results:
                results.append(RetrievalResult(
                    source_type="mistakes",
                    results=mistake_results,
                    query=query,
                    relevance_scores=[r.get("similarity_score", 0)
                                      for r in mistake_results]
                ))

        return results

    def _strategy_quiz(
        self, query: str, config: RetrievalConfig,
        word: Optional[str], sentence: Optional[str],
        selected: Optional[str], correct: Optional[str]
    ) -> List[RetrievalResult]:
        """Strategy for quiz mode (vocabulary definition questions)"""
        results = []

        # Primary: Direct vocabulary lookup
        if word:
            # Try exact match first
            exact_match = self.vocabulary_rag.get_by_lemma(word)
            if exact_match:
                exact_match["similarity_score"] = 1.0
                exact_match["match_type"] = "exact"
                results.append(RetrievalResult(
                    source_type="vocabulary",
                    results=[exact_match],
                    query=word,
                    relevance_scores=[1.0]
                ))

        # Semantic search for related vocabulary
        vocab_results = self.vocabulary_rag.search(
            query=query,
            top_k=config.top_k,
            min_similarity=config.min_similarity,
            use_hybrid=config.use_hybrid
        )
        # Filter out duplicates from exact match
        existing_lemmas = {r.get("lemma", "").lower()
                           for rr in results for r in rr.results}
        vocab_results = [r for r in vocab_results if r.get(
            "lemma", "").lower() not in existing_lemmas]

        if vocab_results:
            results.append(RetrievalResult(
                source_type="vocabulary",
                results=vocab_results,
                query=query,
                relevance_scores=[r.get("similarity_score", 0)
                                  for r in vocab_results]
            ))

        # Check if selected answer matches a common confusion pattern
        if config.include_mistakes and selected and selected != correct:
            confusion_query = f"confusion between {word} and {selected}" if word else query
            mistake_results = self.common_mistakes_rag.search(
                query=confusion_query,
                top_k=2,
                min_similarity=0.25  # Lower threshold for mistake patterns
            )
            if mistake_results:
                results.append(RetrievalResult(
                    source_type="mistakes",
                    results=mistake_results,
                    query=confusion_query,
                    relevance_scores=[r.get("similarity_score", 0)
                                      for r in mistake_results]
                ))

        return results

    def _strategy_antonym(
        self, query: str, config: RetrievalConfig,
        word: Optional[str], sentence: Optional[str],
        selected: Optional[str], correct: Optional[str]
    ) -> List[RetrievalResult]:
        """Strategy for antonym questions"""
        results = []

        if word:
            # Get the word's entry
            word_entry = self.vocabulary_rag.get_by_lemma(word)
            if word_entry:
                word_entry["similarity_score"] = 1.0
                results.append(RetrievalResult(
                    source_type="vocabulary",
                    results=[word_entry],
                    query=word,
                    relevance_scores=[1.0]
                ))

            # Get words that have this as an antonym
            related_antonyms = self.vocabulary_rag.get_antonyms_of(word)
            if related_antonyms:
                for r in related_antonyms:
                    r["similarity_score"] = 0.9
                    r["relationship"] = "has_as_antonym"
                results.append(RetrievalResult(
                    source_type="vocabulary",
                    results=related_antonyms[: 2],
                    query=f"antonym of {word}",
                    relevance_scores=[0.9] * len(related_antonyms[:2])
                ))

            # If correct answer provided, get its entry too
            if correct:
                correct_entry = self.vocabulary_rag.get_by_lemma(correct)
                if correct_entry:
                    correct_entry["similarity_score"] = 0.95
                    correct_entry["relationship"] = "correct_antonym"
                    results.append(RetrievalResult(
                        source_type="vocabulary",
                        results=[correct_entry],
                        query=correct,
                        relevance_scores=[0.95]
                    ))

        # Check for synonym/antonym confusion mistakes
        if config.include_mistakes and selected:
            mistake_results = self.common_mistakes_rag.search(
                query=f"antonym synonym confusion {word} {selected}",
                top_k=1,
                min_similarity=0.2
            )
            if mistake_results:
                results.append(RetrievalResult(
                    source_type="mistakes",
                    results=mistake_results,
                    query=query,
                    relevance_scores=[r.get("similarity_score", 0)
                                      for r in mistake_results]
                ))

        return results

    def _strategy_fill_blanks(
        self, query: str, config: RetrievalConfig,
        word: Optional[str], sentence: Optional[str],
        selected: Optional[str], correct: Optional[str]
    ) -> List[RetrievalResult]:
        """Strategy for fill-in-the-blanks grammar questions"""
        results = []

        # Build context-aware query
        grammar_query = f"Filipino grammar fill blank:  {sentence}" if sentence else query
        if word:
            grammar_query += f" correct word: {word}"

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

        # Check for specific word-related mistakes (e.g., ng vs nang)
        if config.include_mistakes:
            # Search by linguistic focus if word is provided
            if word:
                focus_mistakes = self.common_mistakes_rag.get_by_linguistic_focus(
                    word)
                if focus_mistakes:
                    for m in focus_mistakes:
                        m["similarity_score"] = 0.95
                        m["match_type"] = "linguistic_focus"
                    results.append(RetrievalResult(
                        source_type="mistakes",
                        results=focus_mistakes[: 2],
                        query=word,
                        relevance_scores=[0.95] * len(focus_mistakes[:2])
                    ))

            # Also search for general grammar mistakes
            if selected and selected != correct:
                mistake_query = f"grammar error:  used {selected} instead of {correct}"
                mistake_results = self.common_mistakes_rag.search(
                    query=mistake_query,
                    top_k=2,
                    min_similarity=0.25,
                    filter_category="grammar"
                )
                if mistake_results:
                    results.append(RetrievalResult(
                        source_type="mistakes",
                        results=mistake_results,
                        query=mistake_query,
                        relevance_scores=[r.get("similarity_score", 0)
                                          for r in mistake_results]
                    ))

        return results

    def _strategy_error_identification(
        self, query: str, config: RetrievalConfig,
        word: Optional[str], sentence: Optional[str],
        selected: Optional[str], correct: Optional[str]
    ) -> List[RetrievalResult]:
        """Strategy for error identification questions"""
        results = []

        # Build error-focused query
        error_query = f"Filipino grammar error in:  {sentence}" if sentence else query
        if correct:
            error_query += f" error part:  {correct}"

        # Primary: Common mistakes (most relevant for this mode)
        if config.include_mistakes:
            # Direct linguistic focus search
            if correct:
                focus_mistakes = self.common_mistakes_rag.get_by_linguistic_focus(
                    correct)
                if focus_mistakes:
                    for m in focus_mistakes:
                        m["similarity_score"] = 0.98
                        m["match_type"] = "direct_error_match"
                    results.append(RetrievalResult(
                        source_type="mistakes",
                        results=focus_mistakes[: 2],
                        query=correct,
                        relevance_scores=[0.98] * len(focus_mistakes[:2])
                    ))

            # Semantic search for error patterns
            mistake_results = self.common_mistakes_rag.search(
                query=error_query,
                top_k=config.top_k,
                min_similarity=config.min_similarity,
                use_hybrid=config.use_hybrid
            )
            # Filter duplicates
            existing_ids = {r.get("error_id")
                            for rr in results for r in rr.results}
            mistake_results = [r for r in mistake_results if r.get(
                "error_id") not in existing_ids]

            if mistake_results:
                results.append(RetrievalResult(
                    source_type="mistakes",
                    results=mistake_results,
                    query=error_query,
                    relevance_scores=[r.get("similarity_score", 0)
                                      for r in mistake_results]
                ))

        # Secondary: Grammar rules that explain the error
        grammar_results = self.grammar_rag.search(
            query=error_query,
            top_k=2,
            min_similarity=config.min_similarity,
            use_hybrid=config.use_hybrid
        )
        if grammar_results:
            results.append(RetrievalResult(
                source_type="grammar",
                results=grammar_results,
                query=error_query,
                relevance_scores=[r.get("similarity_score", 0)
                                  for r in grammar_results]
            ))

        return results

    # ==================== Result Processing ====================

    def _merge_and_rank_results(
        self,
        retrieval_results: List[RetrievalResult],
        config:  RetrievalConfig
    ) -> List[Tuple[str, Dict, float]]:
        """
        Merge results from multiple sources, deduplicate, and rank by relevance.

        Returns:  List of (source_type, result_dict, final_score)
        """
        all_results:  List[Tuple[str, Dict, float]] = []

        # Source type weights (prioritize based on typical usefulness)
        source_weights = {
            "vocabulary": 1.0,
            "grammar":  1.0,
            "mistakes":  1.1,  # Slightly boost mistakes as they're directly educational
            "strategies": 0.8
        }

        # Match type boosts
        match_boosts = {
            "exact":  0.2,
            "exact_lemma": 0.2,
            "linguistic_focus": 0.15,
            "direct_error_match": 0.15,
            "keyword_lemma": 0.1,
            "hybrid": 0.0,
            "semantic": -0.05
        }

        for rr in retrieval_results:
            source_weight = source_weights.get(rr.source_type, 1.0)

            for result in rr.results:
                base_score = result.get("similarity_score", 0.5)
                match_type = result.get("match_type", "semantic")
                match_boost = match_boosts.get(match_type, 0.0)

                final_score = (base_score + match_boost) * source_weight
                final_score = min(1.0, max(0.0, final_score)
                                  )  # Clamp to [0, 1]

                all_results.append((rr.source_type, result, final_score))

        # Sort by final score descending
        all_results.sort(key=lambda x: x[2], reverse=True)

        # Deduplicate (keep highest scored version)
        seen_ids = set()
        deduplicated = []

        for source_type, result, score in all_results:
            # Generate unique ID based on content
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
        """Format merged results into a structured context string"""
        if not merged_results:
            return ""

        sections = {
            "vocabulary": [],
            "grammar": [],
            "mistakes": [],
            "strategies": []
        }

        # Group by source type
        for source_type, result, score in merged_results:
            sections[source_type].append((result, score))

        context_parts = []

        # Format vocabulary section
        if sections["vocabulary"]:
            vocab_context = self._format_vocabulary_section(
                sections["vocabulary"], config
            )
            if vocab_context:
                context_parts.append(vocab_context)

        # Format grammar section
        if sections["grammar"]:
            grammar_context = self._format_grammar_section(
                sections["grammar"], config
            )
            if grammar_context:
                context_parts.append(grammar_context)

        # Format mistakes section
        if sections["mistakes"]:
            mistakes_context = self._format_mistakes_section(
                sections["mistakes"], config
            )
            if mistakes_context:
                context_parts.append(mistakes_context)

        # Format strategies section
        if sections["strategies"]:
            strategies_context = self._format_strategies_section(
                sections["strategies"], config
            )
            if strategies_context:
                context_parts.append(strategies_context)

        return "\n\n".join(context_parts)

    def _format_vocabulary_section(
        self,
        results: List[Tuple[Dict, float]],
        config:  RetrievalConfig
    ) -> str:
        """Format vocabulary results into context"""
        if not results:
            return ""

        lines = ["📚 **VOCABULARY REFERENCE:**"]

        for i, (r, score) in enumerate(results[: config.top_k], 1):
            match_indicator = "🎯" if r.get("match_type") in [
                "exact", "exact_lemma"] else "📝"
            lines.append(
                f"\n**{i}.{match_indicator} {r.get('lemma', 'N/A')}** ({r.get('part_of_speech', '')})")
            lines.append(f"   Kahulugan: {r.get('definition', 'N/A')}")

            if r.get("usage"):
                lines.append(f"   Paggamit: {r['usage']}")

            if config.include_examples and r.get("example"):
                gloss = f" ({r.get('example_gloss', '')})" if r.get(
                    'example_gloss') else ""
                lines.append(f"   Halimbawa: \"{r['example']}\"{gloss}")

            if r.get("synonyms"):
                lines.append(
                    f"   Kasingkahulugan: {', '.join(r['synonyms'][:5])}")

            if r.get("antonyms"):
                lines.append(f"   Kasalungat: {', '.join(r['antonyms'][:5])}")

            if r.get("exam_tips"):
                lines.append(f"   💡 Exam tip: {r['exam_tips']}")

            if config.include_sources:
                lines.append(f"   [Relevance:  {score:.2f}]")

        return "\n".join(lines)

    def _format_grammar_section(
        self,
        results: List[Tuple[Dict, float]],
        config:  RetrievalConfig
    ) -> str:
        """Format grammar results into context"""
        if not results:
            return ""

        lines = ["📖 **GRAMMAR RULES:**"]

        for i, (r, score) in enumerate(results[:config.top_k], 1):
            lines.append(
                f"\n**{i}.{r.get('rule_name', 'N/A')}** ({r.get('section', '')})")
            lines.append(f"   {r.get('description', 'N/A')}")

            if r.get("common_errors"):
                lines.append(f"   ⚠️ Common error: {r['common_errors']}")

            if config.include_examples and r.get("examples"):
                lines.append("   Mga halimbawa:")
                for ex in r["examples"][:2]:
                    if isinstance(ex, dict):
                        ex_str = " → ".join(f"{k}: {v}" for k, v in ex.items())
                        lines.append(f"      • {ex_str}")
                    else:
                        lines.append(f"      • {ex}")

            if config.include_sources:
                lines.append(
                    f"   [Source: {r.get('source', 'N/A')} | Relevance: {score:.2f}]")

        return "\n".join(lines)

    def _format_mistakes_section(
        self,
        results: List[Tuple[Dict, float]],
        config: RetrievalConfig
    ) -> str:
        """Format common mistakes into context"""
        if not results:
            return ""

        lines = ["⚠️ **COMMON MISTAKE PATTERNS:**"]

        for i, (r, score) in enumerate(results[:config.top_k], 1):
            match_type = r.get("match_type", "")
            indicator = "🎯" if "direct" in match_type or "focus" in match_type else "⚠️"

            lines.append(
                f"\n**{i}.{indicator} {r.get('error_name', 'N/A')}**")
            lines.append(
                f"   Category: {r.get('error_category', '')} - {r.get('sub_category', '')}")
            lines.append(f"   {r.get('description', 'N/A')}")

            if r.get("why_it_occurs"):
                lines.append("   Bakit nangyayari:")
                for reason in r["why_it_occurs"][:2]:
                    lines.append(f"      • {reason}")

            examples = r.get("examples", {})
            if config.include_examples:
                if examples.get("incorrect"):
                    lines.append(f"   ❌ Mali: {examples['incorrect'][0]}")
                if examples.get("correct"):
                    lines.append(f"   ✅ Tama: {examples['correct'][0]}")
                if examples.get("explanation"):
                    lines.append(f"   💡 {examples['explanation']}")

            rule = r.get("grammar_rule", {})
            if rule.get("rule_statement"):
                lines.append(f"   📚 Rule: {rule['rule_statement']}")

            if rule.get("decision_guide"):
                lines.append("   🎯 Paano magdesisyon:")
                for guide in rule["decision_guide"][: 2]:
                    lines.append(f"      • {guide}")

            feedback = r.get("feedback_templates", {})
            if feedback.get("detailed_feedback"):
                lines.append(f"   💬 Feedback: {feedback['detailed_feedback']}")

            if config.include_sources:
                lines.append(f"   [Relevance: {score:.2f}]")

        return "\n".join(lines)

    def _format_strategies_section(
        self,
        results: List[Tuple[Dict, float]],
        config: RetrievalConfig
    ) -> str:
        """Format learning strategies into context"""
        if not results:
            return ""

        lines = ["📚 **LEARNING STRATEGIES:**"]

        for i, (r, score) in enumerate(results[:2], 1):  # Limit strategies
            lines.append(f"\n**{i}.{r.get('strategy_name', 'N/A')}**")
            lines.append(f"   {r.get('description', 'N/A')}")

            if r.get("step_by_step"):
                lines.append("   Steps:")
                for step in r["step_by_step"][:3]:
                    lines.append(f"      • {step}")

            if r.get("benefits"):
                lines.append(f"   Benefits: {'; '.join(r['benefits'][: 2])}")

        return "\n".join(lines)

    def _truncate_context(self, context: str, max_length: int) -> str:
        """Intelligently truncate context to fit within limit"""
        if len(context) <= max_length:
            return context

        # Try to truncate at section boundaries
        sections = context.split("\n\n")
        truncated = []
        current_length = 0

        for section in sections:
            # Leave room for truncation note
            if current_length + len(section) + 2 <= max_length - 50:
                truncated.append(section)
                current_length += len(section) + 2
            else:
                break

        result = "\n\n".join(truncated)
        if len(result) < len(context):
            result += "\n\n[...  truncated for length ...]"

        return result

    # ==================== Utility Methods ====================

    def search_strategies(
        self,
        query: str,
        top_k: int = 3,
        min_similarity: float = 0.3
    ) -> List[Dict]:
        """Search learning strategies"""
        if not self.strategy_embeddings:
            return []

        docs = [{"text": s.get("searchable_text", ""), "data": s}
                for s in self.learning_strategies]

        results = self.hybrid_searcher.hybrid_search(
            query=query,
            documents=docs,
            embeddings=self.strategy_embeddings,
            text_field="text",
            top_k=top_k
        )

        output = []
        for doc, score, _, _ in results:
            if score >= min_similarity:
                result = doc["data"].copy()
                result["similarity_score"] = score
                output.append(result)

        return output

    def get_statistics(self) -> Dict:
        """Get statistics about loaded references"""
        return {
            "vocabulary_count": len(self.vocabulary_rag.chunks),
            "grammar_rules_count": len(self.grammar_rag.chunks),
            "common_mistakes_count": len(self.common_mistakes_rag.chunks),
            "learning_strategies_count": len(self.learning_strategies),
            "vocabulary_indices": {
                "lemmas": len(self.vocabulary_rag._lemma_index),
                "synonyms": len(self.vocabulary_rag._synonym_index),
                "antonyms": len(self.vocabulary_rag._antonym_index),
                "tags": len(self.vocabulary_rag._tag_index)
            },
            "grammar_indices": {
                "rules": len(self.grammar_rag._rule_index),
                "sections": len(self.grammar_rag._section_index)
            },
            "mistakes_indices": {
                "categories": len(self.common_mistakes_rag._category_index),
                "linguistic_focus": len(self.common_mistakes_rag._linguistic_focus_index)
            }
        }


# Singleton instance
_orchestrator:  Optional[RAGOrchestrator] = None


def get_rag_orchestrator() -> RAGOrchestrator:
    """Get or create the RAG orchestrator singleton"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = RAGOrchestrator()
    return _orchestrator
