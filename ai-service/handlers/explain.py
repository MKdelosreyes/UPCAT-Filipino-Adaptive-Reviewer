from fastapi import HTTPException
from typing import Optional
from pydantic import BaseModel

# Import data
try:
    from data.vocabulary_core import vocabulary_data
    from data.lexicon import lexicon_data
    from data.grammar_core import grammar_data  # ✅ Import grammar data
except ImportError as e:
    print(f"⚠️ Error importing data in explain handler: {e}")
    vocabulary_data = []
    lexicon_data = []
    grammar_data = []

# Import OpenAI client
try:
    from openai import OpenAI
    import os
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except Exception as e:
    print(f"⚠️ Error initializing OpenAI in explain handler: {e}")
    openai_client = None


# ============================================================
# REQUEST/RESPONSE MODELS
# ============================================================

class ExplainRequest(BaseModel):
    mode: str  # ✅ Updated: "quiz", "antonym", "complete-sentence", "error-identification"
    word: str
    correct: str
    selected: Optional[str] = None
    sentence: Optional[str] = None  # ✅ Added for grammar context


class ExplainResponse(BaseModel):
    explanation: str


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get_word_data(word: str):
    """Find word data from lexicon"""
    try:
        # Search in lexicon_data for the word (lemma or surface form)
        for entry in lexicon_data:
            # Check if word matches lemma
            if entry.get("lemma", "").lower() == word.lower():
                return {
                    "word": entry.get("lemma"),
                    "meaning": entry.get("base_definition"),
                    "synonyms": entry.get("relations", {}).get("synonyms", []),
                    "antonyms": entry.get("relations", {}).get("antonyms", [])
                }
            # Check if word matches any surface form
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
        # Search in vocabulary_data for sentences containing the word
        for entry in vocabulary_data:
            # Get the lexicon entry to find the lemma
            lexicon_entry = next(
                (lex for lex in lexicon_data if lex.get(
                    "lemma_id") == entry.get("lemma_id")),
                None
            )
            if lexicon_entry:
                lemma = lexicon_entry.get("lemma", "")
                surface_forms = lexicon_entry.get("surface_forms", [])

                # Check if word appears in lemma or surface forms
                if word.lower() in [lemma.lower()] + [sf.lower() for sf in surface_forms]:
                    # Return first available example
                    return entry.get("sentence_example_1") or entry.get("sentence_example_2") or ""
        return ""
    except Exception as e:
        print(f"⚠️ Error in get_example_sentence: {e}")
        return ""


# ✅ NEW: Get grammar explanation from grammar_data
def get_grammar_explanation(word: str):
    """Find grammar explanation from grammar_data"""
    try:
        # Search in grammar_data for the word
        for entry in grammar_data:
            # Check fill_sentence or error_sentence
            if word.lower() in entry.get("fillCorrectAnswer", "").lower():
                return entry.get("fill_explanation", "")
            if word.lower() in entry.get("errorCorrectAnswer", "").lower():
                return entry.get("error_explanation", "")
        return ""
    except Exception as e:
        print(f"⚠️ Error in get_grammar_explanation: {e}")
        return ""


def build_explanation_prompt(data: dict) -> str:
    """Generate explanation prompt based on mode"""
    mode = data["mode"]
    word = data["word"]
    correct = data["correct"]
    selected = data.get("selected")
    definition = data.get("definition", correct)
    example = data.get("example", "")
    sentence = data.get("sentence", "")

    # ============================================================
    # VOCABULARY MODES
    # ============================================================

    if mode == "quiz":
        base_prompt = f"""You are a helpful Filipino language tutor for UPCAT preparation.

Context:
- Salitang tinatalakay: {word}
- Tamang kahulugan: {correct}
- Official na kahulugan: {definition}"""

        if example:
            base_prompt += f"\n- Halimbawang pangungusap: {example}"

        if selected:
            base_prompt += f"\n- Napili ng estudyante: {selected}"

        base_prompt += f"""

Magbigay ng 3 na punto:
1) Bakit "{correct}" ang tamang sagot (gamitin ang kahulugan)
2) Bakit mali ang napiling sagot (ipaliwanag ang pagkakaiba)
3) Maikling talang pangbokabularyo (isang pangungusap)

Gumamit ng mga bullet points at panatilihing maikli at malinaw. Gumamit ng simpleng Filipino."""

        return base_prompt

    elif mode == "antonym":
        base_prompt = f"""You are a helpful Filipino language tutor for UPCAT preparation.

Context:
- Salitang tinatalakay: {word}
- Kahulugan: {definition}
- Tamang antonym: {correct}"""

        if example:
            base_prompt += f"\n- Halimbawang pangungusap: {example}"

        if selected:
            base_prompt += f"\n- Napili ng estudyante: {selected}"

        base_prompt += f"""

Magbigay ng 3 na punto:
1) Bakit "{correct}" ang tamang antonym ng "{word}"
2) Bakit mali ang napiling sagot
3) Maikling tala tungkol sa antonyms

Gumamit ng mga bullet points. Panatilihing maikli at malinaw."""

        return base_prompt

    # ============================================================
    # GRAMMAR MODES
    # ============================================================

    elif mode == "complete-sentence":
        base_prompt = f"""You are a helpful Filipino grammar tutor for UPCAT preparation.

Context:
- Pangungusap: {sentence}
- Tamang salita: {correct}
- Kahulugan ng salita: {definition}"""

        if selected:
            base_prompt += f"\n- Isinulat ng estudyante: {selected}"

        base_prompt += f"""

Magbigay ng 3 na punto:
1) Bakit "{correct}" ang tamang salita para sa puwang
2) Ano ang grammatical rule o pattern (halimbawa: tense, case, agreement)
3) Bakit mali ang napiling sagot (kung may napili)

Gumamit ng mga bullet points. Maikli at malinaw ang paliwanag."""

        return base_prompt

    elif mode == "error-identification":
        base_prompt = f"""You are a helpful Filipino grammar tutor for UPCAT preparation.

Context:
- Pangungusap: {sentence}
- Bahagi na may error: {correct}"""

        if selected and selected != correct:
            base_prompt += f"\n- Napili ng estudyante: {selected}"

        base_prompt += f"""

Magbigay ng 4 na punto:
1) Bakit may error ang "{correct}"
2) Ano ang tamang paraan (correction)
3) Anong grammar rule ang nilabag
4) Bakit mali ang napiling sagot ng estudyante (kung iba sa tamang sagot)

Gumamit ng mga bullet points. Maikli at malinaw ang paliwanag."""

        return base_prompt

    # ============================================================
    # FALLBACK
    # ============================================================

    else:
        return f"""Explain why "{correct}" is the correct answer.
The student selected "{selected}".
Keep it brief and educational in Filipino."""


# ============================================================
# MAIN HANDLER FUNCTION
# ============================================================

async def handle_explain(request: ExplainRequest) -> ExplainResponse:
    """
    Main handler function for AI explanation generation.
    This is called from main.py
    """
    try:
        print(
            f"📝 Explain request - Word: {request.word}, Mode: {request.mode}")

        # Check if OpenAI client is available
        if not openai_client:
            raise HTTPException(
                status_code=503,
                detail="OpenAI service not available"
            )

        # ✅ Branch logic based on mode
        if request.mode in ["quiz", "antonym"]:
            # VOCABULARY MODES - Use lexicon data
            word_data = get_word_data(request.word)

            if word_data:
                definition = word_data["meaning"]
                print(f"✅ Found word data: {definition[:50]}...")
            else:
                definition = request.correct
                print(
                    f"⚠️ Word not found in lexicon, using correct answer as definition")

            # Get example sentence
            example = get_example_sentence(request.word)
            if example:
                print(f"✅ Found example sentence")
            else:
                print(f"⚠️ No example sentence found")

            # Generate prompt for vocabulary
            prompt = build_explanation_prompt({
                "mode": request.mode,
                "word": request.word,
                "correct": request.correct,
                "selected": request.selected,
                "definition": definition,
                "example": example
            })

        elif request.mode in ["complete-sentence", "error-identification"]:
            # ✅ GRAMMAR MODES - Use grammar data and lexicon
            word_data = get_word_data(request.word)

            if word_data:
                definition = word_data["meaning"]
                print(f"✅ Found word definition: {definition[:50]}...")
            else:
                definition = request.correct
                print(f"⚠️ Using correct answer as definition")

            # Try to get grammar-specific explanation
            grammar_explanation = get_grammar_explanation(request.word)
            if grammar_explanation:
                print(f"✅ Found grammar explanation")

            # Generate prompt for grammar
            prompt = build_explanation_prompt({
                "mode": request.mode,
                "word": request.word,
                "correct": request.correct,
                "selected": request.selected,
                "definition": definition,
                "sentence": request.sentence or "",
                "example": grammar_explanation  # Use grammar explanation if available
            })

        else:
            # Unknown mode - use fallback
            print(f"⚠️ Unknown mode: {request.mode}, using fallback")
            prompt = build_explanation_prompt({
                "mode": request.mode,
                "word": request.word,
                "correct": request.correct,
                "selected": request.selected
            })

        print(f"🤖 Calling OpenAI API...")

        # Call OpenAI
        completion = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.2,
            max_tokens=300,  # ✅ Slightly increased for grammar explanations
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful Filipino language tutor. Be concise, accurate, and friendly. Always respond in Filipino unless asked otherwise."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        explanation = completion.choices[0].message.content or ""
        print(f"✅ Generated explanation ({len(explanation)} chars)")

        return ExplainResponse(explanation=explanation)

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"❌ Error in handle_explain: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
