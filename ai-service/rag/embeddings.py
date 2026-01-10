from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np


class LocalEmbeddingModel:
    def __init__(self, model_name="paraphrase-multilingual-MiniLM-L12-v2"):
        self.model = SentenceTransformer(model_name)

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(
            texts,
            show_progress_bar=True,
            normalize_embeddings=True
        )
        return embeddings.tolist()

    def embed_query(self, query: str) -> List[float]:
        embedding = self.model.encode(
            query,
            normalize_embeddings=True
        )
        return embedding.tolist()
