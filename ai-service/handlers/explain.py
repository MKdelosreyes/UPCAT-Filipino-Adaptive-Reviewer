from fastapi import HTTPException
from typing import Optional
from pydantic import BaseModel
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    from rag.RAGOrchestrator import get_rag_orchestrator
    rag = get_rag_orchestrator()
    print("✅ RAG orchestrator loaded in explain.py")
except ImportError as e:
    print(f"⚠️ Error importing RAG orchestrator in explain.py: {e}")
    rag = None

try:
    from data.vocabulary_core import vocabulary_data
    from data.lexicon import lexicon_data
    from data.grammar_core import grammar_data
except ImportError as e:
    print(f"⚠️ Error importing data in explain handler: {e}")
    vocabulary_data = []
    lexicon_data = []
    grammar_data = []

try:
    from openai import OpenAI
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    print("✅ OpenAI client initialized in explain.py")
except Exception as e:
    print(f"⚠️ Error initializing OpenAI in explain handler: {e}")
    openai_client = None


class ExplainRequest(BaseModel):
    mode: str
    word: str
    correct: str
    selected: Optional[str] = None
    sentence: Optional[str] = None


class ExplainResponse(BaseModel):
    explanation: str


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
    ✅ ENHANCED: Generate explanation prompt with RAG context including common mistakes
    """
    mode = data["mode"]
    word = data["word"]
    correct = data["correct"]
    selected = data.get("selected")
    definition = data.get("definition", correct)
    example = data.get("example", "")
    sentence = data.get("sentence", "")

    rag_context = ""

    if rag:
        try:
            if mode in ["quiz", "antonym"]:
                # Vocabulary context
                rag_query = f"Filipino word: {word}. Definition: {definition}"
                rag_context = rag.get_context(
                    rag_query,
                    context_type="vocabulary",
                    top_k=2,
                    min_similarity=0.4,
                    include_mistakes=True
                )
                print(
                    f"✅ Retrieved vocabulary context with mistakes ({len(rag_context)} chars)")

            elif mode in ["fill-blanks", "error-identification"]:
                # Grammar context with mistakes
                rag_query = f"Filipino grammar: {sentence}. Word: {word}"
                rag_context = rag.get_context(
                    rag_query,
                    context_type="grammar",
                    top_k=2,
                    min_similarity=0.4,
                    include_mistakes=True
                )
                print(
                    f"✅ Retrieved grammar context with mistakes ({len(rag_context)} chars)")
        except Exception as e:
            print(f"⚠️ Error getting RAG context: {e}")
            rag_context = ""
    else:
        print("⚠️ RAG not available")

    # Build prompts based on mode
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

Using the reference materials above, magbigay ng 3 na punto:
1) Bakit "{correct}" ang tamang sagot (gamitin ang kahulugan at references)
2) Bakit mali ang napiling sagot (mention if this is a common mistake pattern)
3) Maikling talang pangbokabularyo (cite similar words from references if relevant)

Gumamit ng mga bullet points. Panatilihing maikli at malinaw."""

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

Using the reference materials above, magbigay ng 3 na punto:
1) Bakit "{correct}" ang tamang antonym ng "{word}"
2) Bakit mali ang napiling sagot (check if this is a common confusion)
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

Using the grammar rules and common mistakes above, magbigay ng 3 na punto:
1) Bakit "{correct}" ang tamang salita para sa puwang
2) Ano ang grammatical rule (cite specific rules from references, mention if student made a common mistake)
3) Bakit mali ang napiling sagot (kung may napili)

Gumamit ng mga bullet points. Panatilihing maikli at malinaw ang sagot."""

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

Using the grammar rules and common mistakes above, magbigay ng 4 na punto:
1) Bakit may error ang "{correct}" (check if this is a documented common mistake)
2) Ano ang tamang paraan (correction)
3) Anong grammar rule ang nilabag (cite from references if available)

Gumamit ng mga bullet points. Panatilihing maikli at malinaw ang sagot. Always cite if this matches a known error pattern from the references."""

        return prompt

    else:
        return f"""Explain why "{correct}" is the correct answer.
The student selected "{selected}".
Keep it brief and educational in Filipino."""


async def handle_explain(request: ExplainRequest) -> ExplainResponse:
    """
    ✅ ENHANCED: Main handler function with RAG integration including common mistakes
    """
    try:
        print(
            f"📝 Explain request - Word: {request.word}, Mode: {request.mode}")

        if not openai_client:
            raise HTTPException(
                status_code=503,
                detail="OpenAI service not available"
            )

        # Get word/grammar data
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

        print(f"🤖 Calling OpenAI with enhanced RAG prompt...")

        completion = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.2,
            max_tokens=200,
            messages=[
                {
                    "role": "system",
                    "content": "You are a Filipino language tutor. Use the provided reference materials (including common mistakes) to give accurate, evidence-based explanations. Always cite if the student's error matches a known common mistake pattern. Be concise and educational."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        explanation = completion.choices[0].message.content or ""
        print(f"✅ Generated enhanced explanation ({len(explanation)} chars)")

        return ExplainResponse(explanation=explanation)

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in handle_explain: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
