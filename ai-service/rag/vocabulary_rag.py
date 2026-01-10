import json
import os
import numpy as np
from typing import List, Dict, Optional

from .embeddings import LocalEmbeddingModel


class VocabularyRAG:
    def __init__(self):
        self.references: List[Dict] = []
        self.embeddings: List[List[float]] = []
        self.embedder = LocalEmbeddingModel()
        self.load_references()

    def load_references(self) -> None:
        references_path = os.path.join(
            os.path.dirname(__file__),
            "references",
            "vocabulary.json",
        )

        with open(references_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for entry in data:
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
                entry.get("difficulty", ""),
            ]

            searchable_text = " ".join(p for p in text_parts if p)

            self.references.append({
                "lemma": entry.get("lemma"),
                "part_of_speech": entry.get("part_of_speech"),
                "definition": entry.get("definition"),
                "usage": entry.get("usage"),
                "example": entry.get("example"),
                "example_gloss": entry.get("example_gloss"),
                "extra_examples": entry.get("extra_examples", []),
                "synonyms": entry.get("synonyms", []),
                "antonyms": entry.get("antonyms", []),
                "tags": entry.get("tags", []),
                "exam_tips": entry.get("exam_tips"),
                "difficulty": entry.get("difficulty"),
                "text": searchable_text,
            })

        print(f"✓ Loaded {len(self.references)} vocabulary reference chunks")

    def embed_references(self) -> None:
        if self.embeddings:
            return

        texts = [ref["text"] for ref in self.references]
        if not texts:
            return

        print(
            f"Creating local embeddings for {len(texts)} vocabulary chunks...")
        self.embeddings = self.embedder.embed_texts(texts)
        print("✓ Vocabulary embeddings created")

    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))

    def search(self, query: str, top_k: int = 3) -> List[Dict]:
        if not self.embeddings:
            self.embed_references()

        query_embedding = self.embedder.embed_query(query)

        sims = [
            (i, self._cosine_similarity(query_embedding, emb))
            for i, emb in enumerate(self.embeddings)
        ]
        sims.sort(key=lambda x: x[1], reverse=True)

        results = []
        for idx, score in sims[:top_k]:
            ref = self.references[idx].copy()
            ref["similarity_score"] = score
            results.append(ref)

        return results

    def get_context_for_word(self, word: str, error_reason: Optional[str] = None) -> str:
        query_parts = [f"Filipino vocabulary word: {word}"]
        if error_reason:
            query_parts.append(f"Context: {error_reason}")

        results = self.search(". ".join(query_parts), top_k=3)

        if not results:
            return f"Walang natagpuang vocabulary reference para sa salitang '{word}'.\n"

        context = "Relevant Vocabulary Entries:\n\n"
        for i, r in enumerate(results, 1):
            context += f"{i}. {r['lemma']} ({r['part_of_speech']})\n"
            context += f"   Kahulugan: {r['definition']}\n"
            if r.get("usage"):
                context += f"   Paggamit: {r['usage']}\n"
            if r.get("example"):
                gloss = f" ({r['example_gloss']})" if r.get(
                    "example_gloss") else ""
                context += f"   Halimbawa: \"{r['example']}\"{gloss}\n"
            if r.get("synonyms"):
                context += f"   Kasingkahulugan: {', '.join(r['synonyms'])}\n"
            if r.get("antonyms"):
                context += f"   Kasalungat: {', '.join(r['antonyms'])}\n"
            if r.get("exam_tips"):
                context += f"   Exam tip: {r['exam_tips']}\n"
            context += "\n"

        return context


_vocabulary_rag: Optional[VocabularyRAG] = None


def get_vocabulary_rag() -> VocabularyRAG:
    global _vocabulary_rag
    if _vocabulary_rag is None:
        _vocabulary_rag = VocabularyRAG()
        _vocabulary_rag.embed_references()
    return _vocabulary_rag
