from typing import List, Dict, Optional, Literal
import os
import sys
import json

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    from rag.grammar_rag import get_grammar_rag
    from rag.vocabulary_rag import get_vocabulary_rag
except ImportError as e:
    print(f"⚠️ Error importing RAG modules in orchestrator: {e}")
    get_grammar_rag = None
    get_vocabulary_rag = None


class RAGOrchestrator:
    """Unified RAG interface for all handlers with common mistakes and learning strategies"""

    def __init__(self):
        """Initialize RAG components"""
        try:
            if get_grammar_rag:
                self.grammar_rag = get_grammar_rag()
                print("✅ Grammar RAG initialized in orchestrator")
            else:
                self.grammar_rag = None
                print("⚠️ Grammar RAG not available")

            if get_vocabulary_rag:
                self.vocab_rag = get_vocabulary_rag()
                print("✅ Vocabulary RAG initialized in orchestrator")
            else:
                self.vocab_rag = None
                print("⚠️ Vocabulary RAG not available")

            # Load common mistakes and learning strategies
            self._load_supplementary_references()

        except Exception as e:
            print(f"❌ Error initializing RAG orchestrator: {e}")
            self.grammar_rag = None
            self.vocab_rag = None
            self.common_mistakes = []
            self.learning_strategies = []

    def _load_supplementary_references(self):
        """Load common mistakes and learning strategies"""
        try:
            # Load common mistakes
            mistakes_path = os.path.join(
                os.path.dirname(__file__),
                "references",
                "common_mistakes.json"
            )
            with open(mistakes_path, 'r', encoding='utf-8') as f:
                self.common_mistakes = json.load(f)
            print(
                f"✅ Loaded {len(self.common_mistakes)} common mistake patterns")

            # Load learning strategies
            strategies_path = os.path.join(
                os.path.dirname(__file__),
                "references",
                "learning_strategies.json"
            )
            with open(strategies_path, 'r', encoding='utf-8') as f:
                self.learning_strategies = json.load(f)
            print(
                f"✅ Loaded {len(self.learning_strategies)} learning strategies")

        except Exception as e:
            print(f"⚠️ Error loading supplementary references: {e}")
            self.common_mistakes = []
            self.learning_strategies = []

    def get_context(
        self,
        query: str,
        context_type: Literal["grammar", "vocabulary", "mixed", "mistakes", "strategies"],
        top_k: int = 3,
        min_similarity: float = 0.5,
        include_mistakes: bool = False,
        include_strategies: bool = False
    ) -> str:
        """
        Get relevant context for a query with intelligent routing.

        Args:
            query: The search query
            context_type: Type of context to retrieve
            top_k: Number of results to return
            min_similarity: Minimum similarity threshold
            include_mistakes: Whether to include common mistakes in response
            include_strategies: Whether to include learning strategies in response

        Returns:
            Formatted context string
        """
        try:
            results = []

            # ✅ ENHANCED: Handle new context types
            if context_type == "mistakes":
                # Search only common mistakes
                results = self._search_common_mistakes(query, top_k)
            elif context_type == "strategies":
                # Search only learning strategies
                results = self._search_learning_strategies(query, top_k)
            elif context_type == "grammar" and self.grammar_rag:
                results = self.grammar_rag.search(query, top_k=top_k)
            elif context_type == "vocabulary" and self.vocab_rag:
                results = self.vocab_rag.search(query, top_k=top_k)
            elif context_type == "mixed":
                # Hybrid search: get from both and merge
                if self.grammar_rag:
                    grammar_results = self.grammar_rag.search(
                        query, top_k=max(1, top_k//2))
                    results.extend(grammar_results)
                if self.vocab_rag:
                    vocab_results = self.vocab_rag.search(
                        query, top_k=max(1, top_k//2))
                    results.extend(vocab_results)

                if results:
                    results = self._merge_and_rank(results)
            else:
                print(f"⚠️ RAG not available for context_type: {context_type}")
                return ""

            # Optionally append common mistakes
            if include_mistakes and context_type not in ["mistakes", "strategies"]:
                mistake_results = self._search_common_mistakes(query, 2)
                if mistake_results:
                    results.extend(mistake_results)

            # Optionally append learning strategies
            if include_strategies and context_type not in ["mistakes", "strategies"]:
                strategy_results = self._search_learning_strategies(query, 2)
                if strategy_results:
                    results.extend(strategy_results)

            # Filter by similarity threshold
            if results:
                results = [r for r in results if r.get(
                    "similarity_score", 0) >= min_similarity]

            if not results:
                print(
                    f"⚠️ No relevant context found for query: {query[:50]}...")
                return ""

            print(f"✅ Found {len(results)} relevant context items")
            return self._format_context(results, context_type)

        except Exception as e:
            print(f"❌ Error in get_context: {e}")
            return ""

    def _search_common_mistakes(self, query: str, top_k: int) -> List[Dict]:
        """Search common mistakes using keyword matching"""
        try:
            query_lower = query.lower()
            scored_results = []

            for mistake in self.common_mistakes:
                score = 0.0

                # Check error name
                if mistake.get("error_name", "").lower() in query_lower:
                    score += 0.5

                # Check linguistic focus
                linguistic_focus = mistake.get("linguistic_focus", [])
                for focus in linguistic_focus:
                    if focus.lower() in query_lower:
                        score += 0.3

                # Check description
                if any(word in mistake.get("description", "").lower()
                       for word in query_lower.split()):
                    score += 0.2

                if score > 0:
                    result = mistake.copy()
                    result["similarity_score"] = min(score, 1.0)
                    result["type"] = "common_mistake"
                    scored_results.append(result)

            # Sort by score and return top_k
            scored_results.sort(
                key=lambda x: x["similarity_score"], reverse=True)
            return scored_results[:top_k]

        except Exception as e:
            print(f"❌ Error searching common mistakes: {e}")
            return []

    def _search_learning_strategies(self, query: str, top_k: int) -> List[Dict]:
        """Search learning strategies using keyword matching"""
        try:
            query_lower = query.lower()
            scored_results = []

            for strategy in self.learning_strategies:
                score = 0.0

                # Check strategy name
                if strategy.get("strategy_name", "").lower() in query_lower:
                    score += 0.5

                # Check target skills
                target_skills = strategy.get("target_skills", [])
                for skill in target_skills:
                    if skill.lower() in query_lower:
                        score += 0.3

                # Check description
                if any(word in strategy.get("description", "").lower()
                       for word in query_lower.split()):
                    score += 0.2

                # Check embedding tags
                rag_metadata = strategy.get("rag_metadata", {})
                embedding_tags = rag_metadata.get("embedding_tags", [])
                for tag in embedding_tags:
                    if tag.lower() in query_lower:
                        score += 0.2

                if score > 0:
                    result = strategy.copy()
                    result["similarity_score"] = min(score, 1.0)
                    result["type"] = "learning_strategy"
                    scored_results.append(result)

            # Sort by score and return top_k
            scored_results.sort(
                key=lambda x: x["similarity_score"], reverse=True)
            return scored_results[:top_k]

        except Exception as e:
            print(f"❌ Error searching learning strategies: {e}")
            return []

    def _merge_and_rank(self, results: List[Dict]) -> List[Dict]:
        """Merge and rank results from multiple sources"""
        try:
            combined = [r for r in results if r]  # Filter out None
            combined.sort(key=lambda x: x.get(
                "similarity_score", 0), reverse=True)
            return combined
        except Exception as e:
            print(f"❌ Error merging results: {e}")
            return results

    def _format_context(self, results: List[Dict], context_type: str) -> str:
        """Format results into readable context"""
        try:
            # Determine what type of results we have
            has_grammar = any("rule_name" in r for r in results)
            has_vocab = any("lemma" in r for r in results)
            has_mistakes = any(
                r.get("type") == "common_mistake" for r in results)
            has_strategies = any(
                r.get("type") == "learning_strategy" for r in results)

            context = ""

            if has_grammar:
                grammar_results = [r for r in results if "rule_name" in r]
                context += self._format_grammar_context(grammar_results)

            if has_vocab:
                vocab_results = [r for r in results if "lemma" in r]
                if context:
                    context += "\n"
                context += self._format_vocab_context(vocab_results)

            if has_mistakes:
                mistake_results = [r for r in results if r.get(
                    "type") == "common_mistake"]
                if context:
                    context += "\n"
                context += self._format_mistakes_context(mistake_results)

            if has_strategies:
                strategy_results = [r for r in results if r.get(
                    "type") == "learning_strategy"]
                if context:
                    context += "\n"
                context += self._format_strategies_context(strategy_results)

            return context
        except Exception as e:
            print(f"❌ Error formatting context: {e}")
            return ""

    def _format_grammar_context(self, results: List[Dict]) -> str:
        """Format grammar results"""
        try:
            context = "📚 **Relevant Grammar Rules:**\n\n"
            for i, result in enumerate(results[:3], 1):
                rule_name = result.get('rule_name', 'Grammar Rule')
                description = result.get('description', '')

                context += f"**{i}. {rule_name}**\n"
                context += f"   {description}\n"

                examples = result.get('examples', [])
                if examples:
                    if isinstance(examples, list):
                        examples_str = ', '.join(str(ex)
                                                 for ex in examples[:2])
                    else:
                        examples_str = str(examples)[:100]
                    context += f"   **Halimbawa:** {examples_str}\n"

                context += "\n"

            return context
        except Exception as e:
            print(f"❌ Error formatting grammar context: {e}")
            return "📚 **Grammar rules found but formatting failed**\n\n"

    def _format_vocab_context(self, results: List[Dict]) -> str:
        """Format vocabulary results"""
        try:
            context = "📖 **Relevant Vocabulary:**\n\n"
            for i, result in enumerate(results[:3], 1):
                lemma = result.get('lemma', 'Word')
                definition = result.get('definition', '')

                context += f"**{i}. {lemma}**\n"
                context += f"   **Kahulugan:** {definition}\n"

                usage = result.get('usage', '')
                if usage:
                    context += f"   **Paggamit:** {usage}\n"

                example = result.get('example', '')
                if example:
                    gloss = result.get('example_gloss', '')
                    gloss_text = f" ({gloss})" if gloss else ""
                    context += f"   **Halimbawa:** \"{example}\"{gloss_text}\n"

                synonyms = result.get('synonyms', [])
                if synonyms and isinstance(synonyms, list):
                    syn_text = ', '.join(synonyms[:3])
                    context += f"   **Kasingkahulugan:** {syn_text}\n"

                context += "\n"

            return context
        except Exception as e:
            print(f"❌ Error formatting vocab context: {e}")
            return "📖 **Vocabulary found but formatting failed**\n\n"

    def _format_mistakes_context(self, results: List[Dict]) -> str:
        """Format common mistakes context"""
        try:
            context = "⚠️ **Common Mistakes to Avoid:**\n\n"
            for i, result in enumerate(results[:2], 1):
                error_name = result.get('error_name', 'Common Error')
                description = result.get('description', '')

                context += f"**{i}. {error_name}**\n"
                context += f"   {description}\n"

                # Add examples
                examples = result.get('examples', {})
                if examples:
                    incorrect = examples.get('incorrect', [])
                    correct = examples.get('correct', [])

                    if incorrect and correct:
                        context += f"   ❌ Mali: {incorrect[0]}\n"
                        context += f"   ✅ Tama: {correct[0]}\n"

                # Add why it occurs
                why_it_occurs = result.get('why_it_occurs', [])
                if why_it_occurs:
                    context += f"   **Bakit nangyayari:** {why_it_occurs[0]}\n"

                context += "\n"

            return context
        except Exception as e:
            print(f"❌ Error formatting mistakes context: {e}")
            return "⚠️ **Common mistakes found but formatting failed**\n\n"

    def _format_strategies_context(self, results: List[Dict]) -> str:
        """Format learning strategies context"""
        try:
            context = "💡 **Recommended Learning Strategies:**\n\n"
            for i, result in enumerate(results[:2], 1):
                strategy_name = result.get(
                    'strategy_name', 'Learning Strategy')
                description = result.get('description', '')

                context += f"**{i}. {strategy_name}**\n"
                context += f"   {description}\n"

                # Add step by step
                steps = result.get('step_by_step', [])
                if steps:
                    context += "   **Mga Hakbang:**\n"
                    for j, step in enumerate(steps[:3], 1):
                        context += f"   {j}. {step}\n"

                # Add benefits
                benefits = result.get('benefits', [])
                if benefits:
                    context += f"   **Benepisyo:** {benefits[0]}\n"

                context += "\n"

            return context
        except Exception as e:
            print(f"❌ Error formatting strategies context: {e}")
            return "💡 **Learning strategies found but formatting failed**\n\n"


# Singleton instance
_orchestrator = None


def get_rag_orchestrator() -> RAGOrchestrator:
    """Get or create RAG orchestrator instance"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = RAGOrchestrator()
    return _orchestrator
