from typing import List, Dict, Optional, Literal
import os
import sys

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
    """Unified RAG interface for all handlers"""

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
        except Exception as e:
            print(f"❌ Error initializing RAG orchestrator: {e}")
            self.grammar_rag = None
            self.vocab_rag = None

    def get_context(
        self,
        query: str,
        context_type: Literal["grammar", "vocabulary", "mixed"],
        top_k: int = 3,
        min_similarity: float = 0.5
    ) -> str:
        """
        Get relevant context for a query with intelligent routing.

        Args:
            query: The search query
            context_type: Type of context to retrieve
            top_k: Number of results to return
            min_similarity: Minimum similarity threshold

        Returns:
            Formatted context string
        """
        try:
            if context_type == "grammar" and self.grammar_rag:
                results = self.grammar_rag.search(query, top_k=top_k)
            elif context_type == "vocabulary" and self.vocab_rag:
                results = self.vocab_rag.search(query, top_k=top_k)
            elif context_type == "mixed":
                # Hybrid search: get from both and merge
                results = []
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

            context = ""

            if has_grammar:
                grammar_results = [r for r in results if "rule_name" in r]
                context += self._format_grammar_context(grammar_results)

            if has_vocab:
                vocab_results = [r for r in results if "lemma" in r]
                if context:  # Add separator if we already have grammar context
                    context += "\n"
                context += self._format_vocab_context(vocab_results)

            return context
        except Exception as e:
            print(f"❌ Error formatting context: {e}")
            return ""

    def _format_grammar_context(self, results: List[Dict]) -> str:
        """Format grammar results"""
        try:
            context = "📚 **Relevant Grammar Rules:**\n\n"
            for i, result in enumerate(results[:3], 1):  # Limit to top 3
                rule_name = result.get('rule_name', 'Grammar Rule')
                description = result.get('description', '')

                context += f"**{i}. {rule_name}**\n"
                context += f"   {description}\n"

                # Add examples if available
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
            for i, result in enumerate(results[:3], 1):  # Limit to top 3
                lemma = result.get('lemma', 'Word')
                pos = result.get('part_of_speech', 'n/a')
                definition = result.get('definition', '')

                context += f"**{i}. {lemma}** ({pos})\n"
                context += f"   **Kahulugan:** {definition}\n"

                # Add usage if available
                usage = result.get('usage', '')
                if usage:
                    context += f"   **Paggamit:** {usage}\n"

                # Add example if available
                example = result.get('example', '')
                if example:
                    gloss = result.get('example_gloss', '')
                    gloss_text = f" ({gloss})" if gloss else ""
                    context += f"   **Halimbawa:** \"{example}\"{gloss_text}\n"

                # Add synonyms if available
                synonyms = result.get('synonyms', [])
                if synonyms and isinstance(synonyms, list):
                    syn_text = ', '.join(synonyms[:3])
                    context += f"   **Kasingkahulugan:** {syn_text}\n"

                context += "\n"

            return context
        except Exception as e:
            print(f"❌ Error formatting vocab context: {e}")
            return "📖 **Vocabulary found but formatting failed**\n\n"


# Singleton instance
_orchestrator = None


def get_rag_orchestrator() -> RAGOrchestrator:
    """Get or create RAG orchestrator instance"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = RAGOrchestrator()
    return _orchestrator


# Test the orchestrator
if __name__ == "__main__":
    print("\n🧪 Testing RAG Orchestrator...\n")

    orch = get_rag_orchestrator()

    # Test vocabulary search
    print("1️⃣ Testing vocabulary search:")
    vocab_context = orch.get_context(
        "Filipino word: adhika. Kahulugan at paggamit",
        context_type="vocabulary",
        top_k=2
    )
    print(vocab_context[:200] +
          "...\n" if len(vocab_context) > 200 else vocab_context)

    # Test grammar search
    print("2️⃣ Testing grammar search:")
    grammar_context = orch.get_context(
        "Filipino grammar: ng vs nang usage",
        context_type="grammar",
        top_k=2
    )
    print(grammar_context[:200] +
          "...\n" if len(grammar_context) > 200 else grammar_context)

    # Test mixed search
    print("3️⃣ Testing mixed search:")
    mixed_context = orch.get_context(
        "Filipino sentence structure and word order",
        context_type="mixed",
        top_k=3
    )
    print(mixed_context[:200] + "..." if len(mixed_context)
          > 200 else mixed_context)
