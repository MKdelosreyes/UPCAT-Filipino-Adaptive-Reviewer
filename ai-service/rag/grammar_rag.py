import json
import os
import numpy as np
from typing import List, Dict

from .embeddings import LocalEmbeddingModel


class GrammarRAG:
    def __init__(self):
        self.references: List[Dict] = []
        self.embeddings: List[List[float]] = []
        self.embedder = LocalEmbeddingModel()
        self.load_references()

    def load_references(self) -> None:
        references_path = os.path.join(
            os.path.dirname(__file__),
            "references",
            "grammar.json"
        )

        with open(references_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for source in data:
            for section in source.get("grammar_sections", []):
                for rule in section.get("rules", []):
                    text = f"{rule['name']}: {rule['description']}"
                    self.references.append({
                        "source": source["source"],
                        "url": source["url"],
                        "section": section["section_name"],
                        "rule_name": rule["name"],
                        "description": rule["description"],
                        "examples": rule.get("examples", []),
                        "difficulty": rule.get("difficulty_level", "intermediate"),
                        "text": text
                    })

        print(f"✓ Loaded {len(self.references)} grammar reference chunks")

    def embed_references(self) -> None:
        if self.embeddings:
            return

        texts = [ref["text"] for ref in self.references]
        print(f"Creating local embeddings for {len(texts)} grammar chunks...")
        self.embeddings = self.embedder.embed_texts(texts)
        print("✓ Grammar embeddings created")

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

    def get_context_for_error(self, error_tag: str, sentence: str) -> str:
        query = f"Filipino grammar error: {error_tag}. Example: {sentence}"
        results = self.search(query, top_k=2)

        context = "Relevant Grammar Rules:\n\n"
        for i, r in enumerate(results, 1):
            context += f"{i}. {r['rule_name']}\n"
            context += f"   {r['description']}\n"
            if r.get("examples"):
                context += f"   Examples: {r['examples'][:2]}\n"
            context += "\n"

        return context


_grammar_rag: GrammarRAG | None = None


def get_grammar_rag() -> GrammarRAG:
    global _grammar_rag
    if _grammar_rag is None:
        _grammar_rag = GrammarRAG()
        _grammar_rag.embed_references()
    return _grammar_rag
