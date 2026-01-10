import json
import os
import numpy as np
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass

from .embeddings import LocalEmbeddingModel, HybridSearcher


@dataclass
class GrammarChunk:
    """Represents a single retrievable grammar chunk"""
    chunk_id: str
    source: str
    url: str
    section: str
    rule_name: str
    description: str
    examples: List[Dict]
    common_errors: Optional[str]
    difficulty: str
    text: str  # Searchable text
    embedding_text: str  # Text used for embedding (can be enriched)
    metadata: Dict


class GrammarRAG:
    def __init__(self):
        self.chunks: List[GrammarChunk] = []
        self.embeddings: List[List[float]] = []
        self.embedder = LocalEmbeddingModel()
        self.hybrid_searcher = HybridSearcher(self.embedder)

        # Index for fast lookups
        # rule_name -> chunk indices
        self._rule_index: Dict[str, List[int]] = {}
        # section -> chunk indices
        self._section_index: Dict[str, List[int]] = {}
        # difficulty -> chunk indices
        self._difficulty_index: Dict[str, List[int]] = {}

        self.load_references()

    def _create_enriched_embedding_text(self, rule:  Dict, section_name: str, source: str) -> str:
        """Create enriched text for better embedding quality"""
        parts = [
            f"Filipino grammar rule: {rule['name']}",
            f"Category: {section_name}",
            f"Description: {rule['description']}",
        ]

        # Add examples as text
        examples = rule.get("examples", [])
        if examples:
            example_texts = []
            for ex in examples[: 3]:  # Limit examples
                if isinstance(ex, dict):
                    example_texts.append(" ".join(str(v) for v in ex.values()))
                else:
                    example_texts.append(str(ex))
            parts.append(f"Examples: {'; '.join(example_texts)}")

        # Add common errors if available
        if rule.get("common_errors"):
            parts.append(f"Common errors: {rule['common_errors']}")

        return " | ".join(parts)

    def _create_searchable_text(self, rule: Dict, section_name: str) -> str:
        """Create searchable text for hybrid search"""
        parts = [
            rule['name'],
            rule['description'],
            section_name,
        ]

        examples = rule.get("examples")
        if examples:
            for ex in examples:
                if isinstance(ex, dict):
                    parts.extend(str(v) for v in ex.values())
                else:
                    parts.append(str(ex))

        common_errors = rule.get("common_errors")
        if common_errors:
            parts.append(common_errors)

        return " ".join(parts)

    def load_references(self) -> None:
        references_path = os.path.join(
            os.path.dirname(__file__),
            "references",
            "grammar.json"
        )

        with open(references_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        chunk_id = 0
        for source in data:
            for section in source.get("grammar_sections", []):
                section_name = section["section_name"]

                for rule in section.get("rules", []):
                    difficulty = rule.get(
                        "difficulty_level", "intermediate").lower()

                    chunk = GrammarChunk(
                        chunk_id=f"grammar_{chunk_id}",
                        source=source["source"],
                        url=source["url"],
                        section=section_name,
                        rule_name=rule["name"],
                        description=rule["description"],
                        examples=rule.get("examples", []),
                        common_errors=rule.get("common_errors"),
                        difficulty=difficulty,
                        text=self._create_searchable_text(rule, section_name),
                        embedding_text=self._create_enriched_embedding_text(
                            rule, section_name, source["source"]),
                        metadata={
                            "source": source["source"],
                            "section": section_name,
                            "difficulty": difficulty
                        }
                    )

                    self.chunks.append(chunk)

                    # Build indices
                    rule_key = rule["name"].lower()
                    if rule_key not in self._rule_index:
                        self._rule_index[rule_key] = []
                    self._rule_index[rule_key].append(chunk_id)

                    section_key = section_name.lower()
                    if section_key not in self._section_index:
                        self._section_index[section_key] = []
                    self._section_index[section_key].append(chunk_id)

                    if difficulty not in self._difficulty_index:
                        self._difficulty_index[difficulty] = []
                    self._difficulty_index[difficulty].append(chunk_id)

                    chunk_id += 1

        print(f"✓ Loaded {len(self.chunks)} grammar reference chunks")
        print(f"  - {len(self._rule_index)} unique rules indexed")
        print(f"  - {len(self._section_index)} sections indexed")

    def embed_references(self) -> None:
        if self.embeddings:
            return

        texts = [chunk.embedding_text for chunk in self.chunks]
        print(f"Creating local embeddings for {len(texts)} grammar chunks...")
        self.embeddings = self.embedder.embed_texts(texts)
        print("✓ Grammar embeddings created")

    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))

    def search(
        self,
        query: str,
        top_k: int = 3,
        min_similarity: float = 0.3,
        use_hybrid: bool = True,
        filter_difficulty: Optional[str] = None,
        filter_section: Optional[str] = None
    ) -> List[Dict]:
        """
        Enhanced search with hybrid retrieval and filtering options
        """
        if not self.embeddings:
            self.embed_references()

        # Apply filters to get candidate indices
        candidate_indices = set(range(len(self.chunks)))

        if filter_difficulty:
            difficulty_indices = set(self._difficulty_index.get(
                filter_difficulty.lower(), []))
            candidate_indices &= difficulty_indices

        if filter_section:
            section_indices = set(
                self._section_index.get(filter_section.lower(), []))
            candidate_indices &= section_indices

        if not candidate_indices:
            candidate_indices = set(range(len(self.chunks)))

        # Prepare filtered documents and embeddings
        filtered_chunks = [self.chunks[i] for i in sorted(candidate_indices)]
        filtered_embeddings = [self.embeddings[i]
                               for i in sorted(candidate_indices)]

        if use_hybrid:
            # Use hybrid search
            docs_for_search = [
                {"text": chunk.text, "chunk":  chunk}
                for chunk in filtered_chunks
            ]

            hybrid_results = self.hybrid_searcher.hybrid_search(
                query=query,
                documents=docs_for_search,
                embeddings=filtered_embeddings,
                text_field="text",
                top_k=top_k,
                semantic_weight=0.6,
                lexical_weight=0.4
            )

            results = []
            for doc, combined_score, semantic_score, lexical_score in hybrid_results:
                if combined_score >= min_similarity:
                    chunk = doc["chunk"]
                    results.append({
                        "chunk_id": chunk.chunk_id,
                        "source": chunk.source,
                        "url": chunk.url,
                        "section": chunk.section,
                        "rule_name": chunk.rule_name,
                        "description": chunk.description,
                        "examples": chunk.examples,
                        "common_errors": chunk.common_errors,
                        "difficulty": chunk.difficulty,
                        "text": chunk.text,
                        "similarity_score": combined_score,
                        "semantic_score": semantic_score,
                        "lexical_score": lexical_score
                    })

            return results

        else:
            # Pure semantic search
            query_embedding = self.embedder.embed_query(query)

            sims = [
                (i, self._cosine_similarity(query_embedding, emb))
                for i, emb in enumerate(filtered_embeddings)
            ]
            sims.sort(key=lambda x: x[1], reverse=True)

            results = []
            for idx, score in sims[:top_k]:
                if score >= min_similarity:
                    chunk = filtered_chunks[idx]
                    results.append({
                        "chunk_id": chunk.chunk_id,
                        "source":  chunk.source,
                        "url": chunk.url,
                        "section": chunk.section,
                        "rule_name":  chunk.rule_name,
                        "description": chunk.description,
                        "examples": chunk.examples,
                        "common_errors": chunk.common_errors,
                        "difficulty": chunk.difficulty,
                        "text":  chunk.text,
                        "similarity_score": score
                    })

            return results

    def get_by_rule_name(self, rule_name:  str) -> List[Dict]:
        """Direct lookup by rule name"""
        indices = self._rule_index.get(rule_name.lower(), [])
        return [self._chunk_to_dict(self.chunks[i]) for i in indices]

    def get_by_section(self, section:  str) -> List[Dict]:
        """Get all rules in a section"""
        indices = self._section_index.get(section.lower(), [])
        return [self._chunk_to_dict(self.chunks[i]) for i in indices]

    def _chunk_to_dict(self, chunk: GrammarChunk) -> Dict:
        return {
            "chunk_id":  chunk.chunk_id,
            "source": chunk.source,
            "url": chunk.url,
            "section": chunk.section,
            "rule_name":  chunk.rule_name,
            "description": chunk.description,
            "examples": chunk.examples,
            "common_errors": chunk.common_errors,
            "difficulty": chunk.difficulty,
            "text": chunk.text
        }

    def get_context_for_error(
        self,
        error_tag: str,
        sentence: str,
        include_examples: bool = True,
        top_k: int = 3
    ) -> str:
        """Enhanced context generation for error explanation"""
        query = f"Filipino grammar error: {error_tag}.Example sentence: {sentence}"
        results = self.search(query, top_k=top_k, use_hybrid=True)

        if not results:
            return f"Walang natagpuang grammar reference para sa error na '{error_tag}'.\n"

        context = "📚 **Relevant Grammar Rules:**\n\n"

        for i, r in enumerate(results, 1):
            context += f"**{i}.{r['rule_name']}** (from {r['section']})\n"
            context += f"   📝 {r['description']}\n"

            if r.get("common_errors"):
                context += f"   ⚠️ Common Error: {r['common_errors']}\n"

            if include_examples and r.get("examples"):
                context += "   📌 Examples:\n"
                for ex in r["examples"][:2]:
                    if isinstance(ex, dict):
                        ex_str = " → ".join(f"{k}: {v}" for k, v in ex.items())
                        context += f"      • {ex_str}\n"
                    else:
                        context += f"      • {ex}\n"

            context += f"   🔗 Source: {r['source']}\n"
            context += f"   📊 Relevance:  {r['similarity_score']:.2f}\n\n"

        return context


_grammar_rag:  GrammarRAG | None = None


def get_grammar_rag() -> GrammarRAG:
    global _grammar_rag
    if _grammar_rag is None:
        _grammar_rag = GrammarRAG()
        _grammar_rag.embed_references()
    return _grammar_rag
