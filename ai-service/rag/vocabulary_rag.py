import json
import os
import numpy as np
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field

from .embeddings import LocalEmbeddingModel, HybridSearcher


@dataclass
class VocabularyChunk:
    """Represents a single retrievable vocabulary entry"""
    chunk_id: str
    lemma: str
    part_of_speech: str
    definition: str
    usage: str
    example:  str
    example_gloss: str
    extra_examples: List[str]
    synonyms: List[str]
    antonyms: List[str]
    tags: List[str]
    exam_tips: str
    difficulty: str
    text: str  # Searchable text
    embedding_text: str  # Text for embedding
    metadata: Dict = field(default_factory=dict)


class VocabularyRAG:
    def __init__(self):
        self.chunks: List[VocabularyChunk] = []
        self.embeddings: List[List[float]] = []
        self.embedder = LocalEmbeddingModel()
        self.hybrid_searcher = HybridSearcher(self.embedder)

        # Indices for fast lookup
        self._lemma_index: Dict[str, int] = {}  # lemma -> chunk index
        # synonym -> chunk indices
        self._synonym_index: Dict[str, List[int]] = {}
        # antonym -> chunk indices
        self._antonym_index: Dict[str, List[int]] = {}
        self._tag_index: Dict[str, List[int]] = {}  # tag -> chunk indices
        # part_of_speech -> chunk indices
        self._pos_index: Dict[str, List[int]] = {}

        self.load_references()

    def _create_enriched_embedding_text(self, entry: Dict) -> str:
        """Create enriched text optimized for Filipino vocabulary embeddings"""
        parts = [
            f"Filipino word: {entry.get('lemma', '')}",
            f"Part of speech: {entry.get('part_of_speech', '')}",
            f"Definition: {entry.get('definition', '')}",
        ]

        if entry.get("usage"):
            parts.append(f"Usage: {entry['usage']}")

        if entry.get("example"):
            gloss = f" ({entry.get('example_gloss', '')})" if entry.get(
                'example_gloss') else ""
            parts.append(f"Example: {entry['example']}{gloss}")

        if entry.get("synonyms"):
            parts.append(f"Synonyms: {', '.join(entry['synonyms'])}")

        if entry.get("antonyms"):
            parts.append(f"Antonyms: {', '.join(entry['antonyms'])}")

        if entry.get("exam_tips"):
            parts.append(f"Exam tips: {entry['exam_tips']}")

        return " | ".join(parts)

    def _create_searchable_text(self, entry: Dict) -> str:
        """Create text for lexical search"""
        text_parts = [
            entry.get("lemma", ""),
            entry.get("definition", ""),
            entry.get("usage", ""),
            entry.get("example", ""),
            entry.get("example_gloss", ""),
            " ".join(entry.get("extra_examples", []) or []),
            " ".join(entry.get("synonyms", []) or []),
            " ".join(entry.get("antonyms", []) or []),
            " ".join(entry.get("tags", []) or []),
            entry.get("exam_tips", ""),
        ]
        return " ".join(p for p in text_parts if p)

    def load_references(self) -> None:
        references_path = os.path.join(
            os.path.dirname(__file__),
            "references",
            "vocabulary.json",
        )

        with open(references_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for idx, entry in enumerate(data):
            chunk_id = f"vocab_{idx}"
            lemma = entry.get("lemma", "").lower()
            pos = entry.get("part_of_speech", "").lower()

            chunk = VocabularyChunk(
                chunk_id=chunk_id,
                lemma=entry.get("lemma", ""),
                part_of_speech=entry.get("part_of_speech", ""),
                definition=entry.get("definition", ""),
                usage=entry.get("usage", ""),
                example=entry.get("example", ""),
                example_gloss=entry.get("example_gloss", ""),
                extra_examples=entry.get("extra_examples", []) or [],
                synonyms=entry.get("synonyms", []) or [],
                antonyms=entry.get("antonyms", []) or [],
                tags=entry.get("tags", []) or [],
                exam_tips=entry.get("exam_tips", ""),
                difficulty=entry.get("difficulty", "intermediate"),
                text=self._create_searchable_text(entry),
                embedding_text=self._create_enriched_embedding_text(entry),
                metadata={
                    "lemma": lemma,
                    "pos": pos,
                    "tags": entry.get("tags", [])
                }
            )

            self.chunks.append(chunk)

            # Build indices
            self._lemma_index[lemma] = idx

            for syn in chunk.synonyms:
                syn_lower = syn.lower()
                if syn_lower not in self._synonym_index:
                    self._synonym_index[syn_lower] = []
                self._synonym_index[syn_lower].append(idx)

            for ant in chunk.antonyms:
                ant_lower = ant.lower()
                if ant_lower not in self._antonym_index:
                    self._antonym_index[ant_lower] = []
                self._antonym_index[ant_lower].append(idx)

            for tag in chunk.tags:
                tag_lower = tag.lower()
                if tag_lower not in self._tag_index:
                    self._tag_index[tag_lower] = []
                self._tag_index[tag_lower].append(idx)

            if pos:
                if pos not in self._pos_index:
                    self._pos_index[pos] = []
                self._pos_index[pos].append(idx)

        print(f"✓ Loaded {len(self.chunks)} vocabulary reference chunks")
        print(f"  - {len(self._lemma_index)} unique lemmas indexed")
        print(f"  - {len(self._synonym_index)} synonym mappings")
        print(f"  - {len(self._antonym_index)} antonym mappings")

    def embed_references(self) -> None:
        if self.embeddings:
            return

        texts = [chunk.embedding_text for chunk in self.chunks]
        if not texts:
            return

        print(
            f"Creating local embeddings for {len(texts)} vocabulary chunks...")
        self.embeddings = self.embedder.embed_texts(texts)
        print("✓ Vocabulary embeddings created")

    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))

    def get_by_lemma(self, lemma: str) -> Optional[Dict]:
        """Direct lookup by lemma"""
        idx = self._lemma_index.get(lemma.lower())
        if idx is not None:
            return self._chunk_to_dict(self.chunks[idx])
        return None

    def get_synonyms_of(self, word: str) -> List[Dict]:
        """Get entries that have this word as a synonym"""
        indices = self._synonym_index.get(word.lower(), [])
        return [self._chunk_to_dict(self.chunks[i]) for i in indices]

    def get_antonyms_of(self, word: str) -> List[Dict]:
        """Get entries that have this word as an antonym"""
        indices = self._antonym_index.get(word.lower(), [])
        return [self._chunk_to_dict(self.chunks[i]) for i in indices]

    def get_by_tag(self, tag: str) -> List[Dict]:
        """Get all entries with a specific tag"""
        indices = self._tag_index.get(tag.lower(), [])
        return [self._chunk_to_dict(self.chunks[i]) for i in indices]

    def search(
        self,
        query:  str,
        top_k:  int = 3,
        min_similarity: float = 0.3,
        use_hybrid: bool = True,
        filter_pos: Optional[str] = None,
        filter_tags: Optional[List[str]] = None,
        boost_exact_match: bool = True
    ) -> List[Dict]:
        """
        Enhanced search with hybrid retrieval, filtering, and exact match boosting
        """
        if not self.embeddings:
            self.embed_references()

        results = []

        # Check for exact lemma match first
        if boost_exact_match:
            query_lower = query.lower().strip()
            # Check direct lemma match
            exact_match = self.get_by_lemma(query_lower)
            if exact_match:
                exact_match["similarity_score"] = 1.0
                exact_match["match_type"] = "exact_lemma"
                results.append(exact_match)

            # Check if query is in definition keywords
            for word in query_lower.split():
                if len(word) > 3:
                    lemma_match = self.get_by_lemma(word)
                    if lemma_match and lemma_match not in results:
                        lemma_match["similarity_score"] = 0.95
                        lemma_match["match_type"] = "keyword_lemma"
                        results.append(lemma_match)

        # Apply filters
        candidate_indices = set(range(len(self.chunks)))

        if filter_pos:
            pos_indices = set(self._pos_index.get(filter_pos.lower(), []))
            candidate_indices &= pos_indices

        if filter_tags:
            tag_indices = set()
            for tag in filter_tags:
                tag_indices.update(self._tag_index.get(tag.lower(), []))
            if tag_indices:
                candidate_indices &= tag_indices

        if not candidate_indices:
            candidate_indices = set(range(len(self.chunks)))

        # Remove already found exact matches
        found_ids = {r.get("chunk_id") for r in results}
        candidate_indices = {i for i in candidate_indices
                             if self.chunks[i].chunk_id not in found_ids}

        if not candidate_indices:
            return results[: top_k]

        # Prepare filtered documents and embeddings
        filtered_chunks = [self.chunks[i] for i in sorted(candidate_indices)]
        filtered_embeddings = [self.embeddings[i]
                               for i in sorted(candidate_indices)]

        remaining_k = top_k - len(results)

        if use_hybrid and remaining_k > 0:
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
                semantic_weight=0.65,
                lexical_weight=0.35
            )

            for doc, combined_score, semantic_score, lexical_score in hybrid_results:
                if combined_score >= min_similarity:
                    chunk = doc["chunk"]
                    result = self._chunk_to_dict(chunk)
                    result["similarity_score"] = combined_score
                    result["semantic_score"] = semantic_score
                    result["lexical_score"] = lexical_score
                    result["match_type"] = "hybrid"
                    results.append(result)

        elif remaining_k > 0:
            # Pure semantic search
            query_embedding = self.embedder.embed_query(query)

            sims = [
                (i, self._cosine_similarity(query_embedding, emb))
                for i, emb in enumerate(filtered_embeddings)
            ]
            sims.sort(key=lambda x: x[1], reverse=True)

            for idx, score in sims[:remaining_k]:
                if score >= min_similarity:
                    chunk = filtered_chunks[idx]
                    result = self._chunk_to_dict(chunk)
                    result["similarity_score"] = score
                    result["match_type"] = "semantic"
                    results.append(result)

        return results[:top_k]

    def _chunk_to_dict(self, chunk: VocabularyChunk) -> Dict:
        return {
            "chunk_id":  chunk.chunk_id,
            "lemma": chunk.lemma,
            "part_of_speech": chunk.part_of_speech,
            "definition": chunk.definition,
            "usage":  chunk.usage,
            "example": chunk.example,
            "example_gloss": chunk.example_gloss,
            "extra_examples": chunk.extra_examples,
            "synonyms": chunk.synonyms,
            "antonyms": chunk.antonyms,
            "tags": chunk.tags,
            "exam_tips": chunk.exam_tips,
            "difficulty": chunk.difficulty,
            "text": chunk.text
        }

    def get_context_for_word(
        self,
        word: str,
        error_reason: Optional[str] = None,
        include_related:  bool = True,
        top_k: int = 3
    ) -> str:
        """Enhanced context generation for vocabulary explanation"""
        query_parts = [f"Filipino vocabulary word: {word}"]
        if error_reason:
            query_parts.append(f"Context: {error_reason}")

        results = self.search(".".join(query_parts),
                              top_k=top_k, use_hybrid=True)

        if not results:
            return f"Walang natagpuang vocabulary reference para sa salitang '{word}'.\n"

        context = "📚 **Relevant Vocabulary Entries:**\n\n"

        for i, r in enumerate(results, 1):
            match_indicator = "🎯" if r.get(
                "match_type") == "exact_lemma" else "📝"
            context += f"**{i}.{match_indicator} {r['lemma']}** ({r['part_of_speech']})\n"
            context += f"   📖 Kahulugan: {r['definition']}\n"

            if r.get("usage"):
                context += f"   💡 Paggamit: {r['usage']}\n"

            if r.get("example"):
                gloss = f" ({r['example_gloss']})" if r.get(
                    "example_gloss") else ""
                context += f"   📌 Halimbawa: \"{r['example']}\"{gloss}\n"

            if r.get("synonyms"):
                context += f"   🔄 Kasingkahulugan: {', '.join(r['synonyms'])}\n"

            if r.get("antonyms"):
                context += f"   ↔️ Kasalungat: {', '.join(r['antonyms'])}\n"

            if r.get("exam_tips"):
                context += f"   📝 Exam tip: {r['exam_tips']}\n"

            context += f"   📊 Relevance:  {r.get('similarity_score', 0):.2f}\n\n"

        # Add related words if requested
        if include_related:
            related_by_synonym = self.get_synonyms_of(word)
            related_by_antonym = self.get_antonyms_of(word)

            if related_by_synonym or related_by_antonym:
                context += "**🔗 Related Words:**\n"

                if related_by_synonym:
                    syn_lemmas = [r['lemma'] for r in related_by_synonym[: 3]]
                    context += f"   Words with '{word}' as synonym: {', '.join(syn_lemmas)}\n"

                if related_by_antonym:
                    ant_lemmas = [r['lemma'] for r in related_by_antonym[:3]]
                    context += f"   Words with '{word}' as antonym: {', '.join(ant_lemmas)}\n"

        return context


_vocabulary_rag:  Optional[VocabularyRAG] = None


def get_vocabulary_rag() -> VocabularyRAG:
    global _vocabulary_rag
    if _vocabulary_rag is None:
        _vocabulary_rag = VocabularyRAG()
        _vocabulary_rag.embed_references()
    return _vocabulary_rag
