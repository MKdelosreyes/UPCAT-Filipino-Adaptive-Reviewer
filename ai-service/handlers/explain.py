from fastapi import HTTPException
from typing import Optional
from pydantic import BaseModel
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# Import RAG orchestrator
try:
    from rag.orchestrator import get_rag_orchestrator
    rag = get_rag_orchestrator()
    print("✅ RAG orchestrator loaded in explain.py")
except ImportError as e:
    print(f"⚠️ Error importing RAG orchestrator in explain.py: {e}")
    rag = None

# Import data
try:
    from data.vocabulary_core import vocabulary_data
    from data.lexicon import lexicon_data
    from data.grammar_core import grammar_data
except ImportError as e:
    print(f"⚠️ Error importing data in explain handler: {e}")
    vocabulary_data = []
    lexicon_data = []
    grammar_data = []

# Import OpenAI client
try:
    from openai import OpenAI
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    print("✅ OpenAI client initialized in explain.py")
except Exception as e:
    print(f"⚠️ Error initializing OpenAI in explain handler: {e}")
    openai_client = None


# ============================================================
# REQUEST/RESPONSE MODELS
# ============================================================

class ExplainRequest(BaseModel):
    mode: str  # "quiz", "antonym", "fill-blanks", "error-identification"
    word: str
    correct: str
    selected: Optional[str] = None
    sentence: Optional[str] = None


class ExplainResponse(BaseModel):
    explanation: str


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get_word_data(word: str):
    """Find word data from lexicon"""
    try:
        for entry in lexicon_data:
            if entry.get("lemma", "").lower() == word.lower():
                return {
                    "word": entry.get("lemma"),
                    "meaning": entry.get("base_definition"),
                    "synonyms": entry.get("relations", {}).get("synonyms", []),
                    "antonyms": entry.get("relations", {}).get("antonyms", [])
                }
            if word.lower() in [sf.lower() for sf in entry.get("surface_forms", [])]:
                return {
                    "word": word,
                    "meaning": entry.get("base_definition"),
                    "synonyms": entry.get("relations", {}).get("synonyms", []),
                    "antonyms": entry.get("relations", {}).get("antonyms", [])
                }
        return None
    except Exception as e:
        print(f"⚠️ Error in get_word_data: {e}")
        return None


def get_example_sentence(word: str):
    """Find example sentence from vocabulary_data"""
    try:
        for entry in vocabulary_data:
            lexicon_entry = next(
                (lex for lex in lexicon_data if lex.get(
                    "lemma_id") == entry.get("lemma_id")),
                None
            )
            if lexicon_entry:
                lemma = lexicon_entry.get("lemma", "")
                surface_forms = lexicon_entry.get("surface_forms", [])

                if word.lower() in [lemma.lower()] + [sf.lower() for sf in surface_forms]:
                    return entry.get("sentence_example_1") or entry.get("sentence_example_2") or ""
        return ""
    except Exception as e:
        print(f"⚠️ Error in get_example_sentence: {e}")
        return ""


def get_grammar_explanation(word: str):
    """Find grammar explanation from grammar_data"""
    try:
        for entry in grammar_data:
            if word.lower() in entry.get("fillCorrectAnswer", "").lower():
                return entry.get("fill_explanation", "")
            if word.lower() in entry.get("errorCorrectAnswer", "").lower():
                return entry.get("error_explanation", "")
        return ""
    except Exception as e:
        print(f"⚠️ Error in get_grammar_explanation: {e}")
        return ""


def build_explanation_prompt_with_rag(data: dict) -> str:
    """
    ✅ NEW: Generate explanation prompt with RAG context
    """
    mode = data["mode"]
    word = data["word"]
    correct = data["correct"]
    selected = data.get("selected")
    definition = data.get("definition", correct)
    example = data.get("example", "")
    sentence = data.get("sentence", "")

    # ============================================================
    # GET RAG CONTEXT BASED ON MODE
    # ============================================================

    rag_context = ""

    if rag:  # Only use RAG if available
        try:
            if mode in ["quiz", "antonym"]:
                # Vocabulary context
                rag_query = f"Filipino word: {word}. Definition: {definition}. Usage and examples"
                rag_context = rag.get_context(
                    rag_query,
                    context_type="vocabulary",
                    top_k=2,
                    min_similarity=0.4
                )
                print(
                    f"✅ Retrieved vocabulary RAG context ({len(rag_context)} chars)")

            elif mode in ["fill-blanks", "error-identification"]:
                # Grammar context
                rag_query = f"Filipino grammar: {sentence}. Word: {word}. Grammar rules and patterns"
                rag_context = rag.get_context(
                    rag_query,
                    context_type="grammar",
                    top_k=2,
                    min_similarity=0.4
                )
                print(
                    f"✅ Retrieved grammar RAG context ({len(rag_context)} chars)")
        except Exception as e:
            print(f"⚠️ Error getting RAG context: {e}")
            rag_context = ""
    else:
        print("⚠️ RAG not available, using prompt without context")

    # ============================================================
    # BUILD PROMPTS WITH RAG CONTEXT
    # ============================================================

    if mode == "quiz":
        prompt = f"""You are a helpful Filipino language tutor for UPCAT preparation.

{rag_context}

**Student's Answer:**
- Salitang tinatalakay: {word}
- Tamang kahulugan: {correct}
- Official na kahulugan: {definition}"""

        if example:
            prompt += f"\n- Halimbawang pangungusap: {example}"

        if selected:
            prompt += f"\n- Napili ng estudyante: {selected}"

        prompt += f"""

Using the reference materials above (if provided), magbigay ng 3 na punto:
1) Bakit "{correct}" ang tamang sagot (gamitin ang kahulugan at references)
2) Bakit mali ang napiling sagot (ipaliwanag ang pagkakaiba)
3) Maikling talang pangbokabularyo (isang pangungusap, cite similar words from references if relevant)

Gumamit ng mga bullet points at panatilihing maikli at malinaw. Gumamit ng simpleng Filipino."""

        return prompt

    elif mode == "antonym":
        prompt = f"""You are a helpful Filipino language tutor for UPCAT preparation.

{rag_context}

**Student's Answer:**
- Salitang tinatalakay: {word}
- Kahulugan: {definition}
- Tamang antonym: {correct}"""

        if example:
            prompt += f"\n- Halimbawang pangungusap: {example}"

        if selected:
            prompt += f"\n- Napili ng estudyante: {selected}"

        prompt += f"""

Using the reference materials above (if provided), magbigay ng 3 na punto:
1) Bakit "{correct}" ang tamang antonym ng "{word}" (cite related words from references if available)
2) Bakit mali ang napiling sagot
3) Maikling tala tungkol sa antonyms

Gumamit ng mga bullet points. Panatilihing maikli at malinaw."""

        return prompt

    elif mode == "fill-blanks":
        prompt = f"""You are a helpful Filipino grammar tutor for UPCAT preparation.

{rag_context}

**Student's Answer:**
- Pangungusap: {sentence}
- Tamang salita: {correct}
- Kahulugan ng salita: {definition}"""

        if selected:
            prompt += f"\n- Isinulat ng estudyante: {selected}"

        prompt += f"""

Using the grammar rules above (if provided), magbigay ng 3 na punto:
1) Bakit "{correct}" ang tamang salita para sa puwang
2) Ano ang grammatical rule o pattern (cite specific rules from references if available)
3) Bakit mali ang napiling sagot (kung may napili)

Gumamit ng mga bullet points. Maikli at malinaw ang paliwanag. Cite grammar rules when possible."""

        return prompt

    elif mode == "error-identification":
        prompt = f"""You are a helpful Filipino grammar tutor for UPCAT preparation.

{rag_context}

**Student's Answer:**
- Pangungusap: {sentence}
- Bahagi na may error: {correct}"""

        if selected and selected != correct:
            prompt += f"\n- Napili ng estudyante: {selected}"

        prompt += f"""

Using the grammar rules above (if provided), magbigay ng 4 na punto:
1) Bakit may error ang "{correct}"
2) Ano ang tamang paraan (correction)
3) Anong grammar rule ang nilabag (cite from references if available)
4) Bakit mali ang napiling sagot ng estudyante (kung iba sa tamang sagot)

Gumamit ng mga bullet points. Maikli at malinaw ang paliwanag. Always cite grammar rules."""

        return prompt

    else:
        # Fallback
        return f"""Explain why "{correct}" is the correct answer.
The student selected "{selected}".
Keep it brief and educational in Filipino."""


# ============================================================
# MAIN HANDLER FUNCTION
# ============================================================

async def handle_explain(request: ExplainRequest) -> ExplainResponse:
    """
    ✅ ENHANCED: Main handler function with RAG integration
    """
    try:
        print(
            f"📝 Explain request - Word: {request.word}, Mode: {request.mode}")

        if not openai_client:
            raise HTTPException(
                status_code=503,
                detail="OpenAI service not available"
            )

        # Get word/grammar data as before
        if request.mode in ["quiz", "antonym"]:
            word_data = get_word_data(request.word)
            definition = word_data["meaning"] if word_data else request.correct
            example = get_example_sentence(request.word)

            prompt_data = {
                "mode": request.mode,
                "word": request.word,
                "correct": request.correct,
                "selected": request.selected,
                "definition": definition,
                "example": example
            }

        elif request.mode in ["fill-blanks", "error-identification"]:
            word_data = get_word_data(request.word)
            definition = word_data["meaning"] if word_data else request.correct
            grammar_explanation = get_grammar_explanation(request.word)

            prompt_data = {
                "mode": request.mode,
                "word": request.word,
                "correct": request.correct,
                "selected": request.selected,
                "definition": definition,
                "sentence": request.sentence or "",
                "example": grammar_explanation
            }

        else:
            prompt_data = {
                "mode": request.mode,
                "word": request.word,
                "correct": request.correct,
                "selected": request.selected
            }

        # ✅ Use RAG-enhanced prompt builder
        prompt = build_explanation_prompt_with_rag(prompt_data)

        print(f"🤖 Calling OpenAI with RAG-enhanced prompt...")

        completion = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.2,
            max_tokens=350,
            messages=[
                {
                    "role": "system",
                    "content": "You are a Filipino language tutor. Use the provided reference materials to give accurate, evidence-based explanations. Always cite sources when available. Be concise and educational."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        explanation = completion.choices[0].message.content or ""
        print(
            f"✅ Generated RAG-enhanced explanation ({len(explanation)} chars)")

        return ExplainResponse(explanation=explanation)

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in handle_explain: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
