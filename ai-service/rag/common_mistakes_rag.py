import json
import os
import numpy as np
from typing import List, Dict, Optional
from dataclasses import dataclass, field

from .embeddings import LocalEmbeddingModel, HybridSearcher


@dataclass
class MistakeChunk:
    """Represents a common mistake entry"""
    chunk_id: str
    error_id: str
    error_name: str
    error_category: str
    sub_category: str
    linguistic_focus: List[str]
    error_type: str
    description: str
    why_it_occurs: List[str]
    difficulty_level: str
    grade_alignment: List[str]
    examples: Dict
    grammar_rule: Dict
    feedback_templates: Dict
    severity: Dict
    sources: List[str]
    text: str
    embedding_text:  str
    metadata: Dict = field(default_factory=dict)


class CommonMistakesRAG:
    def __init__(self):
        self.chunks: List[MistakeChunk] = []
        self.embeddings: List[List[float]] = []
        self.embedder = LocalEmbeddingModel()
        self.hybrid_searcher = HybridSearcher(self.embedder)

        # Indices
        self._error_id_index:  Dict[str, int] = {}
        self._category_index: Dict[str, List[int]] = {}
        self._linguistic_focus_index: Dict[str, List[int]] = {}
        self._difficulty_index: Dict[str, List[int]] = {}

        self.load_references()

    def _create_enriched_embedding_text(self, entry: Dict) -> str:
        """Create optimized embedding text for mistake patterns"""
        parts = [
            f"Filipino language error: {entry.get('error_name', '')}",
            f"Category: {entry.get('error_category', '')} - {entry.get('sub_category', '')}",
            f"Description: {entry.get('description', '')}",
            f"Error type: {entry.get('error_type', '')}",
        ]

        # Add linguistic focus words
        if entry.get("linguistic_focus"):
            parts.append(
                f"Focus words: {', '.join(entry['linguistic_focus'])}")

        # Add why it occurs
        if entry.get("why_it_occurs"):
            parts.append(f"Why it occurs: {'; '.join(entry['why_it_occurs'])}")

        # Add examples
        examples = entry.get("examples", {})
        if examples.get("incorrect"):
            parts.append(
                f"Incorrect examples: {'; '.join(examples['incorrect'][:2])}")
        if examples.get("correct"):
            parts.append(
                f"Correct examples: {'; '.join(examples['correct'][:2])}")
        if examples.get("explanation"):
            parts.append(f"Explanation: {examples['explanation']}")

        # Add grammar rule
        rule = entry.get("grammar_rule", {})
        if rule.get("rule_statement"):
            parts.append(f"Rule: {rule['rule_statement']}")

        return " | ".join(parts)

    def _create_searchable_text(self, entry:  Dict) -> str:
        """Create searchable text for lexical matching"""
        parts = [
            entry.get("error_name", ""),
            entry.get("description", ""),
            entry.get("error_category", ""),
            entry.get("sub_category", ""),
            " ".join(entry.get("linguistic_focus", [])),
            " ".join(entry.get("why_it_occurs", [])),
        ]

        examples = entry.get("examples", {})
        parts.extend(examples.get("incorrect", []))
        parts.extend(examples.get("correct", []))
        parts.append(examples.get("explanation", ""))

        rule = entry.get("grammar_rule", {})
        parts.append(rule.get("rule_name", ""))
        parts.append(rule.get("rule_statement", ""))
        parts.extend(rule.get("decision_guide", []))

        return " ".join(p for p in parts if p)

    def load_references(self) -> None:
        references_path = os.path.join(
            os.path.dirname(__file__),
            "references",
            "common_mistakes.json"
        )

        with open(references_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for idx, entry in enumerate(data):
            chunk_id = f"mistake_{idx}"
            error_id = entry.get("error_id", chunk_id)
            category = entry.get("error_category", "").lower()
            difficulty = entry.get("difficulty_level", "intermediate").lower()

            chunk = MistakeChunk(
                chunk_id=chunk_id,
                error_id=error_id,
                error_name=entry.get("error_name", ""),
                error_category=entry.get("error_category", ""),
                sub_category=entry.get("sub_category", ""),
                linguistic_focus=entry.get("linguistic_focus", []),
                error_type=entry.get("error_type", ""),
                description=entry.get("description", ""),
                why_it_occurs=entry.get("why_it_occurs", []),
                difficulty_level=difficulty,
                grade_alignment=entry.get("grade_alignment", []),
                examples=entry.get("examples", {}),
                grammar_rule=entry.get("grammar_rule", {}),
                feedback_templates=entry.get("feedback_templates", {}),
                severity=entry.get("severity", {}),
                sources=entry.get("sources", []),
                text=self._create_searchable_text(entry),
                embedding_text=self._create_enriched_embedding_text(entry),
                metadata={
                    "error_id":  error_id,
                    "category": category,
                    "priority": entry.get("rag_metadata", {}).get("retrieval_priority", "medium")
                }
            )

            self.chunks.append(chunk)

            # Build indices
            self._error_id_index[error_id] = idx

            if category:
                if category not in self._category_index:
                    self._category_index[category] = []
                self._category_index[category].append(idx)

            for focus in chunk.linguistic_focus:
                focus_lower = focus.lower()
                if focus_lower not in self._linguistic_focus_index:
                    self._linguistic_focus_index[focus_lower] = []
                self._linguistic_focus_index[focus_lower].append(idx)

            if difficulty not in self._difficulty_index:
                self._difficulty_index[difficulty] = []
            self._difficulty_index[difficulty].append(idx)

        print(f"✓ Loaded {len(self.chunks)} common mistake patterns")
        print(f"  - {len(self._category_index)} categories indexed")
        print(
            f"  - {len(self._linguistic_focus_index)} linguistic focus terms indexed")

    def embed_references(self) -> None:
        if self.embeddings:
            return

        texts = [chunk.embedding_text for chunk in self.chunks]
        print(
            f"Creating local embeddings for {len(texts)} mistake patterns...")
        self.embeddings = self.embedder.embed_texts(texts)
        print("✓ Common mistakes embeddings created")

    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))

    def get_by_linguistic_focus(self, word: str) -> List[Dict]:
        """Get mistakes related to specific words"""
        indices = self._linguistic_focus_index.get(word.lower(), [])
        return [self._chunk_to_dict(self.chunks[i]) for i in indices]

    def get_by_category(self, category: str) -> List[Dict]:
        """Get all mistakes in a category"""
        indices = self._category_index.get(category.lower(), [])
        return [self._chunk_to_dict(self.chunks[i]) for i in indices]

    def search(
        self,
        query: str,
        top_k: int = 3,
        min_similarity: float = 0.3,
        use_hybrid: bool = True,
        filter_category: Optional[str] = None,
        boost_linguistic_focus: bool = True
    ) -> List[Dict]:
        """Enhanced search for common mistakes"""
        if not self.embeddings:
            self.embed_references()

        results = []

        # Check for direct linguistic focus match first
        if boost_linguistic_focus:
            query_words = query.lower().split()
            for word in query_words:
                focus_matches = self.get_by_linguistic_focus(word)
                for match in focus_matches:
                    if match not in results:
                        match["similarity_score"] = 0.95
                        match["match_type"] = "linguistic_focus"
                        results.append(match)

        # Apply category filter
        candidate_indices = set(range(len(self.chunks)))

        if filter_category:
            cat_indices = set(self._category_index.get(
                filter_category.lower(), []))
            candidate_indices &= cat_indices

        if not candidate_indices:
            candidate_indices = set(range(len(self.chunks)))

        # Remove already found matches
        found_ids = {r.get("chunk_id") for r in results}
        candidate_indices = {i for i in candidate_indices
                             if self.chunks[i].chunk_id not in found_ids}

        remaining_k = top_k - len(results)

        if candidate_indices and remaining_k > 0:
            filtered_chunks = [self.chunks[i]
                               for i in sorted(candidate_indices)]
            filtered_embeddings = [self.embeddings[i]
                                   for i in sorted(candidate_indices)]

            if use_hybrid:
                docs_for_search = [
                    {"text": chunk.text, "chunk":  chunk}
                    for chunk in filtered_chunks
                ]

                hybrid_results = self.hybrid_searcher.hybrid_search(
                    query=query,
                    documents=docs_for_search,
                    embeddings=filtered_embeddings,
                    text_field="text",
                    top_k=remaining_k,
                    semantic_weight=0.55,
                    lexical_weight=0.45  # Higher lexical weight for error patterns
                )

                for doc, combined_score, semantic_score, lexical_score in hybrid_results:
                    if combined_score >= min_similarity:
                        chunk = doc["chunk"]
                        result = self._chunk_to_dict(chunk)
                        result["similarity_score"] = combined_score
                        result["match_type"] = "hybrid"
                        results.append(result)
            else:
                query_embedding = self.embedder.embed_query(query)
                sims = [
                    (i, self._cosine_similarity(query_embedding, emb))
                    for i, emb in enumerate(filtered_embeddings)
                ]
                sims.sort(key=lambda x: x[1], reverse=True)

                for idx, score in sims[: remaining_k]:
                    if score >= min_similarity:
                        chunk = filtered_chunks[idx]
                        result = self._chunk_to_dict(chunk)
                        result["similarity_score"] = score
                        result["match_type"] = "semantic"
                        results.append(result)

        # Sort by priority and score
        priority_order = {"high": 0, "medium": 1, "low": 2}
        results.sort(key=lambda x: (
            priority_order.get(
                x.get("metadata", {}).get("priority", "medium"), 1),
            -x.get("similarity_score", 0)
        ))

        return results[:top_k]

    def _chunk_to_dict(self, chunk: MistakeChunk) -> Dict:
        return {
            "chunk_id": chunk.chunk_id,
            "error_id":  chunk.error_id,
            "error_name": chunk.error_name,
            "error_category": chunk.error_category,
            "sub_category": chunk.sub_category,
            "linguistic_focus": chunk.linguistic_focus,
            "error_type": chunk.error_type,
            "description": chunk.description,
            "why_it_occurs": chunk.why_it_occurs,
            "difficulty_level":  chunk.difficulty_level,
            "examples": chunk.examples,
            "grammar_rule": chunk.grammar_rule,
            "feedback_templates": chunk.feedback_templates,
            "severity": chunk.severity,
            "metadata": chunk.metadata
        }

    def get_context_for_mistake(
        self,
        query: str,
        selected_answer: Optional[str] = None,
        correct_answer: Optional[str] = None,
        top_k:  int = 2
    ) -> str:
        """Generate context for explaining a mistake"""
        search_query = query
        if selected_answer:
            search_query += f" student selected:  {selected_answer}"
        if correct_answer:
            search_query += f" correct answer: {correct_answer}"

        results = self.search(search_query, top_k=top_k, use_hybrid=True)

        if not results:
            return ""

        context = "⚠️ **Common Mistake Patterns:**\n\n"

        for i, r in enumerate(results, 1):
            context += f"**{i}.{r['error_name']}** ({r['error_category']})\n"
            context += f"   📝 {r['description']}\n"

            if r.get("why_it_occurs"):
                context += f"   ❓ Why it occurs:\n"
                for reason in r["why_it_occurs"][:2]:
                    context += f"      • {reason}\n"

            examples = r.get("examples", {})
            if examples.get("incorrect") and examples.get("correct"):
                context += f"   ❌ Incorrect:  {examples['incorrect'][0]}\n"
                context += f"   ✅ Correct:  {examples['correct'][0]}\n"

            if examples.get("explanation"):
                context += f"   💡 {examples['explanation']}\n"

            rule = r.get("grammar_rule", {})
            if rule.get("rule_statement"):
                context += f"   📚 Rule: {rule['rule_statement']}\n"

            if rule.get("decision_guide"):
                context += f"   🎯 Decision guide:\n"
                for guide in rule["decision_guide"][:2]:
                    context += f"      • {guide}\n"

            feedback = r.get("feedback_templates", {})
            if feedback.get("detailed_feedback"):
                context += f"   💬 Feedback:  {feedback['detailed_feedback']}\n"

            context += "\n"

        return context


_common_mistakes_rag:  Optional[CommonMistakesRAG] = None


def get_common_mistakes_rag() -> CommonMistakesRAG:
    global _common_mistakes_rag
    if _common_mistakes_rag is None:
        _common_mistakes_rag = CommonMistakesRAG()
        _common_mistakes_rag.embed_references()
    return _common_mistakes_rag
