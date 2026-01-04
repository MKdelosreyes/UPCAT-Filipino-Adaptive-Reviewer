from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import os
import sys
import httpx
import random
from dotenv import load_dotenv

# Load environment variables FIRST
load_dotenv()

# Import data modules
try:
    from data.vocabulary_core import vocabulary_data
    from data.lexicon import lexicon_data
    from data.grammar_core import grammar_data
    from data.sentence_construction_core import sentence_construction_data
    print(f"✅ Loaded {len(vocabulary_data)} vocabulary items")
    print(f"✅ Loaded {len(lexicon_data)} lexicon items")
    print(f"✅ Loaded {len(grammar_data)} grammar items")
except ImportError as e:
    print(f"⚠️ Error loading data modules: {e}")
    vocabulary_data = []
    lexicon_data = []
    grammar_data = []
    sentence_construction_data = []

# Verify OpenAI API key exists
api_key = os.getenv("OPENAI_API_KEY")
if not api_key or api_key == "your_openai_api_key_here":
    print("❌ ERROR: OPENAI_API_KEY not set in .env file")
    print("Please edit ai-service/.env and add your OpenAI API key")
    sys.exit(1)

# Import OpenAI after env check
try:
    from openai import OpenAI
    openai_client = OpenAI(api_key=api_key)
    print("✅ OpenAI client initialized successfully")
except Exception as e:
    print(f"❌ ERROR initializing OpenAI client: {e}")
    print("\nTry running: pip install --upgrade openai httpx")
    sys.exit(1)

# Import handlers
try:
    from handlers.explain import handle_explain, ExplainRequest, ExplainResponse
    print("✅ Loaded explain handler")
except ImportError as e:
    print(f"⚠️ Error loading explain handler: {e}")
    handle_explain = None

try:
    from handlers.redefine import handle_redefine, RedefineRequest, RedefineResponse
    print("✅ Loaded redefine handler")
except ImportError as e:
    print(f"⚠️ Error loading redefine handler: {e}")
    handle_redefine = None

# Initialize FastAPI
app = FastAPI(
    title="UPCAT Filipino Reviewer AI Service",
    description="AI-powered Filipino language learning service for UPCAT preparation",
    version="1.0.0"
)

# CORS Configuration
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:8000/api")

# ============================================================
# REQUEST/RESPONSE MODELS
# ============================================================


class VocabularyExercisesRequest(BaseModel):
    user_id: Optional[int] = None
    target_difficulty: Optional[str] = None
    limit: int = 15


class GrammarExercisesRequest(BaseModel):
    user_id: Optional[int] = None
    target_difficulty: Optional[str] = None
    # "error_identification" or "fill_in_the_blanks"
    exercise_type: Optional[str] = None
    limit: int = 15


class TipsRequest(BaseModel):
    score: int
    missedLowFreq: int
    similarChoiceErrors: int
    lastDifficulty: str
    module: str


class TipsResponse(BaseModel):
    tips: str


class ConfusablesRequest(BaseModel):
    word: str
    topK: Optional[int] = 3


class ConfusableWord(BaseModel):
    word: str
    meaning: str
    example: str


class ConfusablesResponse(BaseModel):
    results: List[ConfusableWord]


class HealthResponse(BaseModel):
    status: str
    message: str
    openai_configured: bool


class DetailedHealthResponse(BaseModel):
    service: str
    openai_key_configured: bool
    vocabulary_data_loaded: bool
    vocabulary_count: Optional[int] = None


# ============================================================
# HELPER FUNCTIONS
# ============================================================

async def fetch_user_lexical_difficulties(
    user_id: int, token: Optional[str] = None
) -> Dict[str, float]:
    """
    Call backend /api/progress/lexical-difficulties/ for a given user.
    Returns a mapping lemma_id -> difficulty_score (float or None).
    """
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    url = f"{BACKEND_API_URL}/progress/lexical-difficulties/"
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    difficulties = {}
    for item in data.get("difficulties", []):
        lemma_id = item["lemma_id"]
        score = item["difficulty_score"]
        difficulties[lemma_id] = score
    return difficulties


def bucket_from_score(score: Optional[float]) -> Optional[str]:
    """
    Map continuous difficulty_score in [0,1] to 'easy' | 'medium' | 'hard'.
    """
    if score is None:
        return None
    if score < 0.3:
        return "easy"
    if score < 0.6:
        return "medium"
    return "hard"


def estimate_grammar_difficulty(item: dict) -> str:
    """
    Estimate difficulty of a grammar item based on its characteristics.
    This is a heuristic fallback when we don't have user-specific data.

    Factors:
    - Sentence length (longer = harder)
    - Explanation length (longer explanation = more complex)
    - Error position (errors at end = easier to spot)
    """
    try:
        # Get sentence for analysis
        sentence = item.get("error_sentence", "") or item.get(
            "fill_sentence", "")
        explanation = item.get("error_explanation", "") or item.get(
            "fill_explanation", "")

        # Factor 1: Sentence length
        word_count = len(sentence.split())
        length_score = 0
        if word_count <= 10:
            length_score = 0  # Easy
        elif word_count <= 20:
            length_score = 1  # Medium
        else:
            length_score = 2  # Hard

        # Factor 2: Explanation complexity
        exp_word_count = len(explanation.split())
        explanation_score = 0
        if exp_word_count <= 15:
            explanation_score = 0  # Easy
        elif exp_word_count <= 30:
            explanation_score = 1  # Medium
        else:
            explanation_score = 2  # Hard

        # Combine scores
        total_score = length_score + explanation_score

        if total_score <= 1:
            return "easy"
        elif total_score <= 3:
            return "medium"
        else:
            return "hard"

    except Exception as e:
        print(f"⚠️ Error estimating difficulty: {e}")
        return "medium"  # Default fallback

# ============================================================
# ENDPOINTS
# ============================================================


@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    return HealthResponse(
        status="running",
        message="UPCAT Filipino AI Service",
        openai_configured=bool(api_key)
    )


@app.get("/health", response_model=DetailedHealthResponse)
async def health_check():
    """Detailed health check"""
    checks = {
        "service": "online",
        "openai_key_configured": bool(api_key),
        "vocabulary_data_loaded": False,
    }

    try:
        checks["vocabulary_data_loaded"] = len(vocabulary_data) > 0
        checks["vocabulary_count"] = len(vocabulary_data)
    except:
        pass

    return checks


@app.post("/explain", response_model=ExplainResponse)
async def explain(request: ExplainRequest):
    """Generate AI explanation for incorrect answers"""
    if not handle_explain:
        raise HTTPException(
            status_code=503,
            detail="Explain handler not available"
        )
    return await handle_explain(request)


@app.post("/redefine", response_model=RedefineResponse)
async def redefine_word(request: RedefineRequest):
    """Redefine word with multiple perspectives"""
    if not handle_redefine:
        raise HTTPException(
            status_code=503,
            detail="Redefine handler not available"
        )
    return await handle_redefine(request)


# ============================================================
# OTHER ENDPOINTS
# ============================================================

def tips_prompt(data: dict) -> str:
    """Generate tips prompt"""
    return f"""You are a coach for UPCAT Filipino.

Student summary:
- Score: {data["score"]}%
- Missed low-frequency words: {data["missedLowFreq"]}
- Similar-choice errors: {data["similarChoiceErrors"]}
- Last difficulty: {data["lastDifficulty"]}

Give:
- 3 short, actionable tips (bullets)
- A 15–20 minute plan with concrete steps (bullets)"""


@app.post("/tips", response_model=TipsResponse)
async def generate_tips(request: TipsRequest):
    """Generate personalized study tips"""
    try:
        prompt = tips_prompt(request.dict())

        completion = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.3,
            messages=[
                {"role": "system", "content": "Be practical and concise."},
                {"role": "user", "content": prompt}
            ]
        )

        tips = completion.choices[0].message.content or ""
        return TipsResponse(tips=tips)

    except Exception as e:
        print(f"Error in /tips: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/confusables", response_model=ConfusablesResponse)
async def find_confusables(request: ConfusablesRequest):
    """Find similar/confusing words using embeddings"""
    try:
        import math

        def cosine_similarity(a, b):
            dot = sum(x * y for x, y in zip(a, b))
            na = math.sqrt(sum(x * x for x in a))
            nb = math.sqrt(sum(x * x for x in b))
            return dot / (na * nb + 1e-9)

        candidates = [v.get("lemma", "")
                      for v in lexicon_data if v.get("lemma")]

        target_emb = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=request.word
        ).data[0].embedding

        cand_embs = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=candidates
        ).data

        scored = []
        for i, emb_data in enumerate(cand_embs):
            if candidates[i] != request.word:
                score = cosine_similarity(target_emb, emb_data.embedding)
                scored.append({"word": candidates[i], "score": score})

        ranked = sorted(scored, key=lambda x: x["score"], reverse=True)[
            :request.topK]

        results = []
        for r in ranked:
            entry = next(
                (v for v in lexicon_data if v.get("lemma") == r["word"]), None)
            if entry:
                vocab_entry = next(
                    (v for v in vocabulary_data if v.get(
                        "lemma_id") == entry.get("lemma_id")),
                    None
                )
                example = ""
                if vocab_entry:
                    example = vocab_entry.get("sentence_example_1", "") or vocab_entry.get(
                        "sentence_example_2", "")

                results.append(ConfusableWord(
                    word=r["word"],
                    meaning=entry.get("base_definition", ""),
                    example=example
                ))

        return ConfusablesResponse(results=results)

    except Exception as e:
        print(f"Error in /confusables: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# VOCABULARY EXERCISE ENDPOINTS
# ============================================================

@app.post("/exercises/vocabulary")
async def get_vocabulary_exercises_adaptive(
    request: VocabularyExercisesRequest,
    authorization: Optional[str] = Header(None),
):
    """Adaptive vocabulary exercise selection"""
    user_id = request.user_id
    target_difficulty = request.target_difficulty
    limit = request.limit

    if user_id is None or authorization is None:
        items = list(vocabulary_data)
        random.shuffle(items)
        return {"exercises": items[:limit]}

    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()

    try:
        user_difficulties = await fetch_user_lexical_difficulties(
            user_id=user_id,
            token=token,
        )
    except Exception as e:
        print("⚠️ Failed to fetch lexical difficulties:", e)
        items = list(vocabulary_data)
        random.shuffle(items)
        return {"exercises": items[:limit]}

    annotated = []
    for item in vocabulary_data:
        lemma_id = item.get("lemma_id")
        score = user_difficulties.get(lemma_id)
        bucket = bucket_from_score(score)
        annotated.append((item, bucket))

    if target_difficulty not in {"easy", "medium", "hard"}:
        target_difficulty = None

    preferred = []
    others = []

    for item, bucket in annotated:
        if target_difficulty is not None and bucket == target_difficulty:
            preferred.append(item)
        else:
            others.append(item)

    selected = []
    random.shuffle(preferred)
    selected.extend(preferred[:limit])

    if len(selected) < limit:
        remaining = limit - len(selected)
        random.shuffle(others)
        selected.extend(others[:remaining])

    return {"exercises": selected[:limit]}


# ============================================================
# GRAMMAR EXERCISE ENDPOINTS
# ============================================================

@app.post("/exercises/grammar")
async def get_grammar_exercises_adaptive(
    request: GrammarExercisesRequest,
    authorization: Optional[str] = Header(None),
):
    """
    Adaptive grammar exercise selection.

    Request body:
    {
      "user_id": 123,                          # optional
      "target_difficulty": "medium",            # optional: "easy" | "medium" | "hard"
      "exercise_type": "error_identification",  # optional (ignored - kept for API compatibility)
      "limit": 15
    }

    Note: exercise_type is kept in the request for API compatibility but is not used for filtering.
    Each grammar item contains data for both error_identification and fill_in_the_blanks exercises.
    The frontend extracts the relevant fields based on the exercise page.
    """
    user_id = request.user_id
    target_difficulty = request.target_difficulty
    exercise_type = request.exercise_type  # Keep for logging but don't filter
    limit = request.limit

    print(
        f"🎯 Grammar request: user_id={user_id}, difficulty={target_difficulty}, type={exercise_type}")

    # ✅ Don't filter by exercise_type - all items support both exercise types
    filtered_items = grammar_data

    if not filtered_items:
        print("⚠️ No grammar items available")
        # Return empty but valid response
        return {"exercises": []}

    # Define helper function for selection with heuristic
    def select_exercises_with_heuristic():
        annotated = []
        for item in filtered_items:
            estimated_diff = estimate_grammar_difficulty(item)
            annotated.append((item, estimated_diff))

        if target_difficulty in {"easy", "medium", "hard"}:
            preferred = [item for item,
                         diff in annotated if diff == target_difficulty]
            others = [item for item,
                      diff in annotated if diff != target_difficulty]
        else:
            preferred = []
            others = [item for item, _ in annotated]

        random.shuffle(preferred)
        random.shuffle(others)

        selected = preferred[:limit]
        if len(selected) < limit:
            remaining = limit - len(selected)
            selected.extend(others[:remaining])

        # Safety fallback - if still empty, return random items
        if not selected and filtered_items:
            random.shuffle(filtered_items)
            selected = filtered_items[:limit]

        return selected

    # Case 1: No user or no auth - use heuristic difficulty
    if user_id is None or authorization is None:
        print("📊 Using heuristic difficulty estimation (no auth)")
        selected = select_exercises_with_heuristic()
        print(f"✅ Selected {len(selected)} grammar items (heuristic)")
        return {"exercises": selected}

    # Case 2: User + auth - use lexical difficulty data
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()

    try:
        user_difficulties = await fetch_user_lexical_difficulties(
            user_id=user_id,
            token=token,
        )
        print(f"📊 Fetched {len(user_difficulties)} user difficulties")
    except Exception as e:
        print(
            f"⚠️ Failed to fetch difficulties: {e}, using heuristic fallback")
        selected = select_exercises_with_heuristic()
        return {"exercises": selected}

    # Annotate grammar items with user's difficulty data
    annotated = []
    for item in filtered_items:
        lemma_id = item.get("lemma_id")
        score = user_difficulties.get(lemma_id)

        if score is not None:
            bucket = bucket_from_score(score)
        else:
            bucket = estimate_grammar_difficulty(item)

        annotated.append((item, bucket))

    # Selection strategy
    if target_difficulty not in {"easy", "medium", "hard"}:
        target_difficulty = None

    preferred = []
    others = []

    for item, bucket in annotated:
        if target_difficulty is not None and bucket == target_difficulty:
            preferred.append(item)
        else:
            others.append(item)

    selected = []
    random.shuffle(preferred)
    selected.extend(preferred[:limit])

    if len(selected) < limit:
        remaining = limit - len(selected)
        random.shuffle(others)
        selected.extend(others[:remaining])

    # Final safety check
    if not selected and filtered_items:
        print("⚠️ No exercises matched criteria, returning random selection")
        random.shuffle(filtered_items)
        selected = filtered_items[:limit]

    print(f"✅ Selected {len(selected)} grammar items (adaptive)")
    return {"exercises": selected[:limit]}


@app.get("/exercises/lexicon")
async def get_lexicon_exercises():
    if not lexicon_data:
        raise HTTPException(status_code=404, detail="Lexicon data not loaded")
    return {"exercises": lexicon_data, "count": len(lexicon_data)}


@app.get("/debug/data-status")
async def debug_data_status():
    status = {}

    try:
        status["vocabulary"] = {"loaded": True, "count": len(vocabulary_data)}
    except Exception as e:
        status["vocabulary"] = {"loaded": False, "error": str(e)}

    try:
        status["lexicon"] = {"loaded": True, "count": len(lexicon_data)}
    except Exception as e:
        status["lexicon"] = {"loaded": False, "error": str(e)}

    try:
        status["grammar"] = {"loaded": True, "count": len(grammar_data)}

        error_id_count = len([
            item for item in grammar_data
            if item.get("exercise_type") == "error_identification"
        ])
        fill_blanks_count = len([
            item for item in grammar_data
            if item.get("exercise_type") == "fill_in_the_blanks"
        ])

        status["grammar"]["by_type"] = {
            "error_identification": error_id_count,
            "fill_in_the_blanks": fill_blanks_count
        }
    except Exception as e:
        status["grammar"] = {"loaded": False, "error": str(e)}

    return status


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
async def startup_event():
    """Run on startup"""
    print("\n" + "="*60)
    print("🚀 UPCAT Filipino AI Service Starting...")
    print("="*60)
    print(f"✅ OpenAI API Key: {'Configured' if api_key else 'Missing'}")
    print(f"✅ Vocabulary Data: {len(vocabulary_data)} words loaded")
    print(f"✅ Lexicon Data: {len(lexicon_data)} entries loaded")
    print(f"✅ Grammar Data: {len(grammar_data)} exercises loaded")
    print(
        f"✅ Explain Handler: {'Loaded' if handle_explain else 'Not Available'}")
    print(
        f"✅ Redefine Handler: {'Loaded' if handle_redefine else 'Not Available'}")
    print("="*60)
    print(f"🌐 Server running on http://localhost:8001")
    print(f"📚 API Docs: http://localhost:8001/docs")
    print("="*60 + "\n")


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8001))

    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )
