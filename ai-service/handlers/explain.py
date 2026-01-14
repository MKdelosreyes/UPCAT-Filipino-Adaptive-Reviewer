from fastapi import HTTPException
from typing import Optional, Dict, List
from pydantic import BaseModel
import os
import sys
import time
from datetime import datetime, timedelta

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
    from data.sentence_construction_core import sentence_construction_data
except ImportError as e:
    print(f"⚠️ Error importing data in explain handler: {e}")
    vocabulary_data = []
    lexicon_data = []
    grammar_data = []
    sentence_construction_data = []

try:
    from groq import Groq

    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY not found in environment")

    groq_client = Groq(api_key=groq_api_key)

    print("✅ Groq client initialized in explain.py")
except Exception as e:
    print(f"⚠️ Error initializing Groq in explain handler: {e}")
    groq_client = None

try:
    from utils.token_counter import get_token_counter
    token_counter = get_token_counter()
except ImportError:
    print("⚠️ Token counter not available")
    token_counter = None


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


def get_sentence_construction_data(item_id: str):
    """Find sentence construction data by item_id"""
    try:
        for entry in sentence_construction_data:
            if entry.get("item_id") == item_id:
                return entry
        return None
    except Exception as e:
        print(f"⚠️ Error in get_sentence_construction_data: {e}")
        return None


def build_explanation_prompt_with_rag(data: dict) -> str:
    """
    Generate explanation prompt with RAG context including common mistakes
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
                if rag_context:
                    print(
                        f"✅ Retrieved vocabulary context with mistakes ({len(rag_context)} chars)")
                else:
                    print("⚠️ No RAG context found")

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
                if rag_context:
                    print(
                        f"✅ Retrieved grammar context with mistakes ({len(rag_context)} chars)")
                else:
                    print("⚠️ No RAG context found")
            
            elif mode == "reading-comprehension":
                # Reading comprehension context
                rag_query = f"Reading comprehension: {word}. Passage: {sentence}"
                rag_context = rag.get_context(
                    rag_query,
                    context_type="vocabulary",
                    top_k=2,
                    min_similarity=0.3,
                    include_mistakes=False
                )
                if rag_context:
                    print(
                        f"✅ Retrieved reading context ({len(rag_context)} chars)")
                else:
                    print("⚠️ No RAG context found")
            
            elif mode == "sentence-construction":
                # Sentence construction context
                rag_query = f"Sentence construction: {word}. Context: {sentence}"
                rag_context = rag.get_context(
                    rag_query,
                    context_type="vocabulary",  # Use vocabulary context for sentence construction
                    top_k=2,
                    min_similarity=0.4,
                    include_mistakes=True
                )
                if rag_context:
                    print(
                        f"✅ Retrieved sentence construction context with mistakes ({len(rag_context)} chars)")
                else:
                    print("⚠️ No RAG context found")
        except Exception as e:
            print(f"⚠️ Error getting RAG context: {e}")
            import traceback
            traceback.print_exc()
            rag_context = ""
    else:
        print("⚠️ RAG not available")

    # System instruction for Groq
    system_instruction = """You are a Filipino language tutor for UPCAT preparation. Use the provided reference materials to give accurate, evidence-based explanations. Be concise and educational. Respond in Filipino."""

    # Build prompts based on mode
    if mode == "quiz":
        prompt = f"""{system_instruction}

{rag_context if rag_context else "Note: Reference materials are temporarily unavailable, but provide a helpful explanation based on your knowledge."}

**Student's Answer:**
- Salita: {word}
- Tamang kahulugan: {correct}
- Opisyal na kahulugan: {definition}"""

        if selected:
            prompt += f"\n- Napili ng estudyante: {selected}"

        prompt += f"""

Using the reference materials above, diretsong ipaliwanag ang sumusunod:
1) Bakit "{correct}" ang tamang sagot
2) Bakit mali ang napiling sagot (mention if this is a common mistake pattern)

1 paragraph for each point consisting of 1-2 short sentences each."""

        # return prompt

    elif mode == "antonym":
        prompt = f"""{system_instruction}

{rag_context if rag_context else "Note: Reference materials are temporarily unavailable, but provide a helpful explanation based on your knowledge."}

**Student's Answer:**
- Salitang tinatalakay: {word}
- Kahulugan: {definition}
- Tamang antonym: {correct}"""

        if selected:
            prompt += f"\n- Napili ng estudyante: {selected}"

        prompt += f"""

Using the reference materials above, diretang ipaliwanag ang sumusunod:
1) Bakit "{correct}" ang tamang kasalungat ng "{word}"
2) Bakit mali ang napiling sagot (check if this is a synonym)

Make the explanations short and clear."""

        # return prompt

    elif mode == "fill-blanks":
        prompt = f"""{system_instruction}

{rag_context if rag_context else "Note: Reference materials are temporarily unavailable, but provide a helpful explanation based on your knowledge."}

**Student's Answer:**
- Pangungusap: {sentence}
- Tamang salita: {correct}
- Kahulugan ng salita: {definition}"""

        if selected:
            prompt += f"\n- Napili ng estudyante: {selected}"

        prompt += f"""

Using the grammar rules and common mistakes above, magbigay ng 3 na punto:
1) Bakit "{correct}" ang tamang salita
2) Ano ang grammatical rule (cite specific rules from references, mention if student made a common mistake)
3) Bakit mali ang napiling sagot (kung may napili)

Make the explanations short and clear."""

        # return prompt

    elif mode == "error-identification":
        prompt = f"""{system_instruction}

{rag_context if rag_context else "Note: Reference materials are temporarily unavailable, but provide a helpful explanation based on your knowledge."}

**Student's Answer:**
- Pangungusap: {sentence}
- Bahagi na may error: {correct}"""

        if selected and selected != correct:
            prompt += f"\n- Napili ng estudyante: {selected}"

        prompt += f"""

Using the grammar rules and common mistakes above, magbigay ng 4 na punto:
1) Bakit may error ang "{correct}"
2) Ano ang tamang paraan (correction)
3) Ano ang grammar rule na nilabag
4) Bakit mali ang napiling sagot ng estudyante

Make the explanations short and clear."""

    elif mode == "reading-comprehension":
        prompt = f"""{system_instruction}

{rag_context if rag_context else "Note: Reference materials are temporarily unavailable, but provide a helpful explanation based on your knowledge."}

**Student's Answer:**
- Tanong: {word}
- Tamang sagot: {correct}"""

        if selected:
            prompt += f"\n- Napili ng estudyante: {selected}"
        
        if sentence:
            prompt += f"\n- Pamagat ng teksto: {sentence}"

        prompt += f"""

Using the reference materials above, magbigay ng maikling paliwanag:
1) Bakit "{correct}" ang tamang sagot sa tanong
2) Bakit mali ang napiling sagot ng estudyante
3) Anong mahahalagang detalye sa teksto ang hindi napansin ng estudyante

Make the explanation concise and educational in Filipino. 2-3 sentences total."""

    elif mode == "sentence-construction":
        prompt = f"""{system_instruction}

{rag_context if rag_context else "Note: Reference materials are temporarily unavailable, but provide a helpful explanation based on your knowledge."}

**Student's Answer:**
- Exercise: {word}
- Tamang sagot: {correct}"""

        if selected:
            prompt += f"\n- Napili ng estudyante: {selected}"
        
        if sentence:
            prompt += f"\n- Konteksto: {sentence}"

        prompt += f"""

Using the reference materials above, magbigay ng malinaw na paliwanag:
1) Bakit "{correct}" ang tamang sagot
2) Ano ang tuntunin ng grammar/sentence construction na ginamit
3) Bakit mali ang napiling sagot ng estudyante (kung mayroon)

Make the explanation educational and concise in Filipino. 2-3 sentences total."""

    else:
        prompt += f"""{system_instruction}

Explain why "{correct}" is the correct answer.
The student selected "{selected}".
Keep it brief and educational in Filipino."""

    return (system_instruction, prompt)


async def handle_explain(request: ExplainRequest) -> ExplainResponse:
    """
    Main handler function with RAG integration using Gemini API
    """
    try:
        print(
            f"📝 Explain request - Word: {request.word}, Mode: {request.mode}")

        if not groq_client:
            raise HTTPException(
                status_code=503,
                detail="Groq service not available"
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
        
        elif request.mode == "reading-comprehension":
            # For reading comprehension, word = question, sentence = passage title
            prompt_data = {
                "mode": request.mode,
                "word": request.word,
                "correct": request.correct,
                "selected": request.selected,
                "sentence": request.sentence or ""
            }

        elif request.mode == "sentence-construction":
            # For sentence construction, word = exercise description, sentence = context
            sc_data = get_sentence_construction_data(request.word)
            explanation = sc_data.get("explanation", "") if sc_data else ""
            
            prompt_data = {
                "mode": request.mode,
                "word": request.word,
                "correct": request.correct,
                "selected": request.selected,
                "sentence": request.sentence or "",
                "explanation": explanation
            }

        else:
            prompt_data = {
                "mode": request.mode,
                "word": request.word,
                "correct": request.correct,
                "selected": request.selected
            }

        # Use RAG-enhanced prompt builder
        system_instruction, prompt = build_explanation_prompt_with_rag(
            prompt_data)

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ]

        if token_counter:
            combined_prompt = f"{system_instruction}\n\n{prompt}"
            token_counter.log_request(
                endpoint="/explain",
                prompt=combined_prompt,
                response=""
            )

            # Check rate limits
            status = token_counter.get_rate_limit_status()
            if status['requests_last_1min'] >= 15:  # Gemini free tier: 15 RPM
                print("⚠️ WARNING: Approaching rate limit (15 requests/min)")
            if status['requests_last_1min'] >= 10:
                print("⚠️ WARNING: High request rate detected")

        print(f"🤖 Calling Gemini with enhanced RAG prompt...")
        print(f"📏 Prompt length: {len(prompt):,} characters")

        max_retries = 3
        retry_delay = 2

        for attempt in range(max_retries):
            try:
                completion = groq_client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=messages,
                    temperature=0.2,
                    max_tokens=300,
                    top_p=1,
                    stream=False
                )

                explanation = completion.choices[0].message.content or ""

                if token_counter:
                    combined_prompt = f"{system_instruction}\n\n{prompt}"
                    token_counter.log_request(
                        endpoint="/explain",
                        prompt=combined_prompt,
                        response=explanation
                    )

                print(f"✅ Generated explanation ({len(explanation)} chars)")

                return ExplainResponse(explanation=explanation)

            except Exception as api_error:
                error_msg = str(api_error)

                # Handle rate limit errors
                if "429" in error_msg or "rate_limit" in error_msg.lower():
                    if attempt < max_retries - 1:
                        wait_time = retry_delay * (2 ** attempt)
                        print(f"⚠️ Rate limit hit. Waiting {wait_time}s...")
                        time.sleep(wait_time)
                        continue
                    else:
                        raise HTTPException(
                            status_code=429,
                            detail="Rate limit exceeded. Please try again in a few seconds."
                        )
                else:
                    raise

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in handle_explain: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
