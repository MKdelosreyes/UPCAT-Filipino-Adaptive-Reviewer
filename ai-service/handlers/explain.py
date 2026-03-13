from groq import Groq
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
    from data.reading_comprehension_core import reading_comprehension_data
except ImportError as e:
    print(f"⚠️ Error importing data in explain handler: {e}")
    vocabulary_data = []
    lexicon_data = []
    grammar_data = []
    reading_comprehension_data = []

try:
    from utils.token_counter import get_token_counter
    token_counter = get_token_counter()
except ImportError:
    print("⚠️ Token counter not available")
    token_counter = None


def get_groq_client():
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY not found in environment")

    groq_client = Groq(api_key=groq_api_key)
    return groq_client


class ExplainRequest(BaseModel):
    mode: str
    word: str
    correct: str
    selected: Optional[str] = None
    sentence: Optional[str] = None
    explanation: Optional[str] = None


class ExplainResponse(BaseModel):
    explanation: str
    retrieved_context: Optional[List[Dict]] = None
    retrieval_metadata: Optional[Dict] = None


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


def build_explanation_prompt_with_rag(data: dict, return_chunks: bool = False) -> str:
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
    retrieved_chunks = []
    retrieval_metadata = {}

    if rag:
        try:
            if mode in ["quiz", "antonym"]:
                # Vocabulary context
                rag_query = f"Filipino word: {word}. Definition: {definition}"
                context_response = rag.get_context(
                    rag_query,
                    context_type="vocabulary",
                    top_k=2,
                    min_similarity=0.4,
                    include_mistakes=True,
                    return_chunks=return_chunks,
                    # so orchestrator can build a better enhanced query + exact match
                    word=word,
                    selected_answer=selected,
                    correct_answer=correct,
                )

                if return_chunks:
                    rag_context = context_response.formatted_context
                    retrieved_chunks = context_response.retrieved_chunks
                    retrieval_metadata = context_response.retrieval_metadata
                else:
                    rag_context = context_response

            elif mode in ["fill-blanks", "error-identification"]:
                # Grammar context with mistakes
                rag_query = f"Filipino grammar: {sentence}. Word: {word}"
                context_response = rag.get_context(
                    rag_query,
                    context_type="grammar",
                    top_k=2,
                    min_similarity=0.4,
                    include_mistakes=True,
                    return_chunks=return_chunks,
                    word=word,
                    sentence=sentence,
                    selected_answer=selected,
                    correct_answer=correct,
                )

                if return_chunks:
                    rag_context = context_response.formatted_context
                    retrieved_chunks = context_response.retrieved_chunks
                    retrieval_metadata = context_response.retrieval_metadata
                else:
                    rag_context = context_response

            elif mode == "reading-comprehension":
                # Reading comprehension context - USE DEDICATED STRATEGY
                rag_query = f"Reading comprehension: {word}. Passage: {sentence}"
                context_response = rag.get_context(
                    rag_query,
                    context_type="reading-comprehension",  # CHANGED: Use dedicated type
                    top_k=2,
                    min_similarity=0.3,
                    include_mistakes=False,
                    return_chunks=return_chunks,
                    word=word,
                    sentence=sentence,
                    selected_answer=selected,
                    correct_answer=correct,
                )

                if return_chunks:
                    rag_context = context_response.formatted_context
                    retrieved_chunks = context_response.retrieved_chunks
                    retrieval_metadata = context_response.retrieval_metadata
                else:
                    rag_context = context_response

            elif mode == "sentence-ordering":
                # Sentence ordering - USE DEDICATED STRATEGY
                rag_query = f"Filipino sentence ordering: Correct: {correct}"
                context_response = rag.get_context(
                    rag_query,
                    context_type="sentence-ordering",  # CHANGED: Use dedicated type
                    top_k=3,
                    min_similarity=0.20,
                    include_mistakes=True,
                    return_chunks=return_chunks,
                    sentence=correct,  # Pass correct sentence as reference
                    selected_answer=selected,
                    correct_answer=correct,
                )

                if return_chunks:
                    rag_context = context_response.formatted_context
                    retrieved_chunks = context_response.retrieved_chunks
                    retrieval_metadata = context_response.retrieval_metadata
                else:
                    rag_context = context_response

            elif mode == "choose-sentence":
                # Choose sentence - USE DEDICATED STRATEGY
                rag_query = f"Filipino sentence selection: Context: {sentence}. Best: {correct}"
                context_response = rag.get_context(
                    rag_query,
                    context_type="choose-sentence",  # CHANGED: Use dedicated type
                    top_k=3,
                    min_similarity=0.20,
                    include_mistakes=True,
                    return_chunks=return_chunks,
                    sentence=sentence,  # Pass context
                    selected_answer=selected,
                    correct_answer=correct,
                )

                if return_chunks:
                    rag_context = context_response.formatted_context
                    retrieved_chunks = context_response.retrieved_chunks
                    retrieval_metadata = context_response.retrieval_metadata
                else:
                    rag_context = context_response

        except Exception as e:
            print(f"⚠️ Error getting RAG context: {e}")
            import traceback
            traceback.print_exc()
            rag_context = ""
    else:
        print("⚠️ RAG not available")

    # System instruction for Groq
    system_instruction = """You are a Filipino language tutor for UPCAT preparation. 

CRITICAL INSTRUCTIONS:
1. Use information from the provided reference materials below. 
2. If the reference materials don't contain relevant information, say "Batay sa mga sanggunian..." and provide a brief, conservative explanation.
4. When explaining, CITE the specific reference (e.g., "Ayon sa vocabulary reference..." or "Batay sa grammar rule...").
5. Use the provided reference materials to give accurate, evidence-based explanations. Be concise and educational.

Respond in Filipino."""

    # Initialize prompt variable
    prompt = ""

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

Make the explanations short and clear. Answer in 1 paragraph with 3-4 sentences."""

        # return prompt

    elif mode == "error-identification":
        prompt = f"""{system_instruction}

{rag_context if rag_context else "Note: Reference materials are temporarily unavailable, but provide a helpful explanation based on your knowledge."}

**Student's Answer:**
- Pangungusap: {sentence}
- Bahagi na may error: {correct}"""

        if selected and selected != correct:
            prompt += f"\n- Napili ng estudyante: {selected}"

        prompt += """

If the correct answer is "Walang Mali", explain why the sentence is grammatically correct and why the student's chosen answer is incorrect (if any). Do NOT describe any grammatical error.

Otherwise, explain the grammatical error, the correct form, the violated rule, and why the student's answer is incorrect.

Answer in 1 paragraph with 3–4 sentences. Respond in Filipino."""

    elif mode == "reading-comprehension":
        # Include the official explanation from the question data if available
        official_explanation = data.get("explanation", "")

        prompt = f"""{system_instruction}

{rag_context if rag_context else "Note: Reference materials are temporarily unavailable, but provide a helpful explanation based on your knowledge."}

**Student's Answer:**
- Tanong: {word}
- Tamang sagot: {correct}"""

        if selected:
            prompt += f"\n- Napili ng estudyante: {selected}"

        if sentence:
            prompt += f"\n- Pamagat ng teksto: {sentence}"

        if official_explanation:
            prompt += f"\n\n**Official Explanation (Use this as the foundation of your answer):**\n{official_explanation}"

        prompt += f"""

Based on the official explanation provided above, magbigay ng maikling paliwanag sa Filipino na:
1) Ipaliwanag kung bakit "{correct}" ang tamang sagot (use the official explanation as reference)
2) Ituro kung bakit mali ang napiling sagot ng estudyante: "{selected}"
3) Banggitin ang mahahalagang punto mula sa official explanation na dapat maintindihan pero huwag mismo banggitin na galing ito sa official explanation.

Keep it concise and educational in Filipino. 2-3 sentences total."""

    elif mode == "sentence-ordering":
        # For sentence ordering exercises
        user_sentence = data.get("selected", "")
        official_explanation = data.get("explanation", "")

        prompt = f"""{system_instruction}

{rag_context if rag_context else "Note: Reference materials are temporarily unavailable, but provide a helpful explanation based on your knowledge."}

**Student's Answer:**
- Tamang pagkakasunod-sunod: {correct}
- Pagkakasunod-sunod ng estudyante: {user_sentence}"""

        if official_explanation:
            prompt += f"\n\n**Official Explanation (Use this as the foundation of your answer):**\n{official_explanation}"

        prompt += f"""

Magbigay ng maikling paliwanag sa Filipino na:
1) Ipaliwanag kung bakit "{correct}" ang tamang pagkakasunod-sunod ng mga salita
2) Ituro kung ano ang mali sa pagkakasunod-sunod ng estudyante: "{user_sentence}"
3) Banggitin ang mga mahahalagang grammar rules o sentence structure na dapat sundin

Keep it concise and educational in Filipino. 2-3 sentences total."""

    elif mode == "choose-sentence":
        # For choose sentence exercises
        context = data.get("sentence", "")
        user_choice = data.get("selected", "")
        official_explanation = data.get("explanation", "")

        prompt = f"""{system_instruction}

{rag_context if rag_context else "Note: Reference materials are temporarily unavailable, but provide a helpful explanation based on your knowledge."}

**Student's Answer:**
- Konteksto: {context}
- Tamang pangungusap: {correct}
- Napiling pangungusap ng estudyante: {user_choice}"""

        if official_explanation:
            prompt += f"\n\n**Official Explanation (Use this as the foundation of your answer):**\n{official_explanation}"

        prompt += f"""

Magbigay ng maikling paliwanag sa Filipino na:
1) Ipaliwanag kung bakit "{correct}" ang pinakamainam na pangungusap para sa konteksto
2) Ituro kung bakit hindi angkop ang napiling pangungusap ng estudyante: "{user_choice}"
3) Banggitin ang mga mahahalagang sentence construction principles o context clues

Keep it concise and educational in Filipino. 2-3 sentences total."""

    else:
        prompt = f"""{system_instruction}

Explain why "{correct}" is the correct answer.
The student selected "{selected}".
Keep it brief and educational in Filipino."""

    # return (system_instruction, prompt)
    if return_chunks:
        return (system_instruction, prompt, retrieved_chunks, retrieval_metadata)
    else:
        return (system_instruction, prompt)


async def handle_explain(request: ExplainRequest, return_chunks: bool = False) -> ExplainResponse:
    """
    Main handler function with RAG integration using Groq API
    """
    try:
        print(
            f"📝 Explain request - Word: {request.word}, Mode: {request.mode}")

        if not get_groq_client():
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
                "sentence": request.sentence or "",
                "explanation": request.explanation or ""
            }

        elif request.mode == "sentence-ordering":
            # For sentence ordering, word is not needed, correct = correct sentence, selected = user's sentence
            prompt_data = {
                "mode": request.mode,
                "word": request.word or "",
                "correct": request.correct,
                "selected": request.selected,
                "explanation": request.explanation or ""
            }

        elif request.mode == "choose-sentence":
            # For choose sentence, sentence = context, correct = correct sentence, selected = user's choice
            prompt_data = {
                "mode": request.mode,
                "word": request.word or "",
                "correct": request.correct,
                "selected": request.selected,
                "sentence": request.sentence or "",
                "explanation": request.explanation or ""
            }

        else:
            prompt_data = {
                "mode": request.mode,
                "word": request.word,
                "correct": request.correct,
                "selected": request.selected
            }

        # Use RAG-enhanced prompt builder
        # system_instruction, prompt = build_explanation_prompt_with_rag(
        #     prompt_data)
        prompt_result = build_explanation_prompt_with_rag(
            prompt_data,
            return_chunks=return_chunks
        )

        if return_chunks:
            system_instruction, prompt, retrieved_chunks, retrieval_metadata = prompt_result
        else:
            system_instruction, prompt = prompt_result
            retrieved_chunks = None
            retrieval_metadata = None

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
            if status['requests_last_1min'] >= 15:
                print("⚠️ WARNING: Approaching rate limit (15 requests/min)")
            if status['requests_last_1min'] >= 10:
                print("⚠️ WARNING: High request rate detected")

        print(f"🤖 Calling Groq with enhanced RAG prompt...")
        print(f"📏 Prompt length: {len(prompt):,} characters")

        max_retries = 3
        retry_delay = 2

        for attempt in range(max_retries):
            try:
                completion = get_groq_client().chat.completions.create(
                    model="llama-3.3-70b-versatile",
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

                return ExplainResponse(
                    explanation=explanation,
                    retrieved_context=retrieved_chunks if return_chunks else None,
                    retrieval_metadata=retrieval_metadata if return_chunks else None
                )

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
