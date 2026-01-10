from sentence_transformers import SentenceTransformer
from typing import List, Dict, Optional, Tuple
import numpy as np
import hashlib
import json
import os
import re
from pathlib import Path


class LocalEmbeddingModel:
    def __init__(self, model_name="paraphrase-multilingual-MiniLM-L12-v2", cache_dir:  Optional[str] = None):
        self.model = SentenceTransformer(model_name)
        self.model_name = model_name

        # Setup cache directory
        if cache_dir is None:
            cache_dir = os.path.join(
                os. path.dirname(__file__), ".embedding_cache")
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)

        # In-memory cache for query embeddings
        self._query_cache:  Dict[str, List[float]] = {}
        self._max_query_cache_size = 1000

    def _get_cache_key(self, texts: List[str]) -> str:
        """Generate a unique cache key for a list of texts"""
        content = json.dumps(texts, sort_keys=True, ensure_ascii=False)
        return hashlib.md5(f"{self.model_name}:{content}".encode()).hexdigest()

    def _load_cached_embeddings(self, cache_key: str) -> Optional[List[List[float]]]:
        """Load embeddings from disk cache"""
        cache_file = self.cache_dir / f"{cache_key}.npy"
        if cache_file.exists():
            try:
                embeddings = np.load(cache_file)
                print(f"✓ Loaded cached embeddings from {cache_file. name}")
                return embeddings. tolist()
            except Exception as e:
                print(f"⚠️ Error loading cache: {e}")
        return None

    def _save_cached_embeddings(self, cache_key: str, embeddings: List[List[float]]) -> None:
        """Save embeddings to disk cache"""
        cache_file = self.cache_dir / f"{cache_key}.npy"
        try:
            np.save(cache_file, np.array(embeddings))
            print(f"✓ Saved embeddings cache to {cache_file.name}")
        except Exception as e:
            print(f"⚠️ Error saving cache: {e}")

    def embed_texts(self, texts: List[str], use_cache: bool = True) -> List[List[float]]:
        """Embed multiple texts with optional caching"""
        if not texts:
            return []

        if use_cache:
            cache_key = self._get_cache_key(texts)
            cached = self._load_cached_embeddings(cache_key)
            if cached is not None:
                return cached

        embeddings = self.model.encode(
            texts,
            show_progress_bar=True,
            normalize_embeddings=True,
            batch_size=32  # Optimize batch processing
        )
        embeddings_list = embeddings.tolist()

        if use_cache:
            self._save_cached_embeddings(cache_key, embeddings_list)

        return embeddings_list

    def embed_query(self, query: str) -> List[float]:
        """Embed a single query with in-memory caching"""
        # Check in-memory cache first
        if query in self._query_cache:
            return self._query_cache[query]

        embedding = self.model.encode(
            query,
            normalize_embeddings=True
        )
        result = embedding.tolist()

        # Add to cache with size limit
        if len(self._query_cache) >= self._max_query_cache_size:
            # Remove oldest entry (FIFO)
            oldest_key = next(iter(self._query_cache))
            del self._query_cache[oldest_key]

        self._query_cache[query] = result
        return result

    def clear_cache(self) -> None:
        """Clear all caches"""
        self._query_cache.clear()
        for cache_file in self.cache_dir.glob("*.npy"):
            cache_file.unlink()
        print("✓ Cleared all embedding caches")


class HybridSearcher:
    """Combines semantic search with lexical (keyword) search for better retrieval"""

    def __init__(self, embedder: LocalEmbeddingModel):
        self.embedder = embedder
        # Filipino-specific stopwords
        self.stopwords = {
            'ang', 'ng', 'sa', 'na', 'at', 'ay', 'mga', 'ito', 'siya', 'ko', 'mo',
            'niya', 'nila', 'kami', 'tayo', 'sila', 'ako', 'ikaw', 'kami', 'kayo',
            'isa', 'dalawa', 'tatlo', 'apat', 'lima', 'para', 'kung', 'kapag',
            'dahil', 'kaya', 'pero', 'ngunit', 'o', 'din', 'rin', 'lang', 'lamang'
        }

    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenization for Filipino text"""
        # Lowercase and split on non-alphanumeric characters
        text = text.lower()
        tokens = re.findall(r'\b[a-záéíóúñ]+\b', text)
        return [t for t in tokens if t not in self.stopwords and len(t) > 2]

    def _calculate_bm25_score(
        self,
        query_tokens: List[str],
        doc_tokens: List[str],
        avg_doc_len: float,
        doc_freqs: Dict[str, int],
        total_docs: int,
        k1: float = 1.5,
        b: float = 0.75
    ) -> float:
        """Calculate BM25 score for a document"""
        score = 0.0
        doc_len = len(doc_tokens)

        for token in query_tokens:
            if token not in doc_tokens:
                continue

            tf = doc_tokens.count(token)
            df = doc_freqs.get(token, 0)

            if df == 0:
                continue

            idf = np.log((total_docs - df + 0.5) / (df + 0.5) + 1)
            tf_norm = (tf * (k1 + 1)) / (tf + k1 *
                                         (1 - b + b * doc_len / avg_doc_len))
            score += idf * tf_norm

        return score

    def hybrid_search(
        self,
        query: str,
        documents: List[Dict],
        embeddings: List[List[float]],
        text_field: str = "text",
        top_k: int = 5,
        semantic_weight: float = 0.7,
        lexical_weight:  float = 0.3
    ) -> List[Tuple[Dict, float, float, float]]:
        """
        Perform hybrid search combining semantic and lexical scoring. 

        Returns:  List of (document, combined_score, semantic_score, lexical_score)
        """
        if not documents or not embeddings:
            return []

        # Semantic search
        query_embedding = self.embedder.embed_query(query)
        semantic_scores = []
        for emb in embeddings:
            score = float(np.dot(query_embedding, emb) /
                          (np.linalg.norm(query_embedding) * np.linalg.norm(emb) + 1e-9))
            semantic_scores.append(score)

        # Lexical search (BM25)
        query_tokens = self._tokenize(query)
        doc_tokens_list = [self._tokenize(
            doc.get(text_field, "")) for doc in documents]

        # Calculate document frequencies
        doc_freqs:  Dict[str, int] = {}
        for tokens in doc_tokens_list:
            for token in set(tokens):
                doc_freqs[token] = doc_freqs.get(token, 0) + 1

        avg_doc_len = np.mean(
            [len(tokens) for tokens in doc_tokens_list]) if doc_tokens_list else 1

        lexical_scores = []
        for doc_tokens in doc_tokens_list:
            score = self._calculate_bm25_score(
                query_tokens, doc_tokens, avg_doc_len, doc_freqs, len(
                    documents)
            )
            lexical_scores.append(score)

        # Normalize scores
        max_semantic = max(semantic_scores) if semantic_scores else 1
        max_lexical = max(lexical_scores) if lexical_scores and max(
            lexical_scores) > 0 else 1

        semantic_scores = [s / max_semantic if max_semantic >
                           0 else 0 for s in semantic_scores]
        lexical_scores = [s / max_lexical if max_lexical >
                          0 else 0 for s in lexical_scores]

        # Combine scores
        results = []
        for i, doc in enumerate(documents):
            combined = (semantic_weight * semantic_scores[i] +
                        lexical_weight * lexical_scores[i])
            results.append(
                (doc, combined, semantic_scores[i], lexical_scores[i]))

        # Sort by combined score
        results.sort(key=lambda x: x[1], reverse=True)

        return results[:top_k]
