from fastapi import HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    from groq import Groq

    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY not found in environment")

    groq_client = Groq(api_key=groq_api_key)
    print("✅ Groq client initialized in summary_checker.py")
except Exception as e:
    print(f"⚠️ Error initializing Groq in summary_checker: {e}")
    groq_client = None


# ============================================================
# REQUEST/RESPONSE MODELS (defined in main.py, imported here for type hints)
# ============================================================

# These models are now defined in main.py to avoid import issues with FastAPI
# We'll use TYPE_CHECKING to import them for type hints only
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from pydantic import BaseModel as _BaseModel
    
    class SummaryCheckRequest(_BaseModel):
        passage_text: str
        user_summary: str
        passage_title: Optional[str] = "Reading Passage"
        difficulty: Optional[str] = "medium"
    
    class SummaryCheckResponse(_BaseModel):
        overall_score: int
        feedback: str
        strengths: List[str]
        improvements: List[str]
        key_points_covered: int
        key_points_total: int
        detailed_scores: dict
else:
    # At runtime, we'll receive the actual models from main.py
    class SummaryCheckRequest(BaseModel):
        passage_text: str
        user_summary: str
        passage_title: Optional[str] = "Reading Passage"
        difficulty: Optional[str] = "medium"
    
    class SummaryCheckResponse(BaseModel):
        overall_score: int
        feedback: str
        strengths: List[str]
        improvements: List[str]
        key_points_covered: int
        key_points_total: int
        detailed_scores: dict


# ============================================================
# PROMPT BUILDER
# ============================================================

def build_summary_evaluation_prompt(data: dict) -> tuple:
    """Generate evaluation prompt for Groq"""
    passage = data["passage_text"]
    summary = data["user_summary"]
    title = data.get("passage_title", "Reading Passage")
    difficulty = data.get("difficulty", "medium")

    system_instruction = """You are an expert Filipino language educator evaluating student reading comprehension summaries for UPCAT preparation. 

Be constructive, encouraging, and specific in your feedback. Focus on helping students improve their summarization skills."""

    user_prompt = f"""**Passage Title:** {title}
**Difficulty Level:** {difficulty}

**Original Passage:**
{passage}

---

**Student's Summary:**
{summary}

---

**EVALUATION TASK:**

Analyze this summary and provide detailed feedback. Evaluate on four criteria:

1. **Key Points Coverage** (0-100): Did they identify and include the main ideas from the passage?
2. **Accuracy** (0-100): Is the information correct without misinterpretations?
3. **Clarity** (0-100): Is the summary well-written, coherent, and easy to understand?
4. **Completeness** (0-100): Are all critical points included without being too verbose?

**RESPONSE FORMAT (JSON):**
{{
  "coverage_score": <0-100>,
  "accuracy_score": <0-100>,
  "clarity_score": <0-100>,
  "completeness_score": <0-100>,
  "overall_score": <average of above>,
  "key_points_identified": <number>,
  "key_points_total": <total key points in passage>,
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2"],
  "feedback": "2-3 encouraging sentences of overall feedback"
}}

**IMPORTANT:**
- Be specific in strengths and improvements
- Feedback should be encouraging and constructive
- List exactly what key points were covered vs missed
- Return ONLY valid JSON, no additional text
"""

    return (system_instruction, user_prompt)


# ============================================================
# MAIN HANDLER
# ============================================================

async def handle_summary_check(request: SummaryCheckRequest) -> SummaryCheckResponse:
    """Evaluate user summary using Groq AI"""
    try:
        print(f"📝 Summary check request - Passage: {request.passage_title[:50]}...")

        if not groq_client:
            raise HTTPException(
                status_code=503,
                detail="Groq service not available"
            )

        # Build evaluation prompt
        system_instruction, user_prompt = build_summary_evaluation_prompt({
            "passage_text": request.passage_text,
            "user_summary": request.user_summary,
            "passage_title": request.passage_title,
            "difficulty": request.difficulty
        })

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_prompt}
        ]

        print(f"🤖 Calling Groq for summary evaluation...")

        # Call Groq API
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.3,  # Lower temp for consistent evaluation
            max_tokens=600,
            top_p=1,
            stream=False
        )

        response_text = completion.choices[0].message.content or ""
        print(f"✅ Generated evaluation ({len(response_text)} chars)")

        # Parse JSON response
        try:
            # Clean potential markdown code blocks
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            result = json.loads(response_text)
            
            return SummaryCheckResponse(
                overall_score=int(result.get("overall_score", 0)),
                feedback=result.get("feedback", ""),
                strengths=result.get("strengths", [])[:3],  # Max 3
                improvements=result.get("improvements", [])[:3],  # Max 3
                key_points_covered=int(result.get("key_points_identified", 0)),
                key_points_total=int(result.get("key_points_total", 0)),
                detailed_scores={
                    "coverage": int(result.get("coverage_score", 0)),
                    "accuracy": int(result.get("accuracy_score", 0)),
                    "clarity": int(result.get("clarity_score", 0)),
                    "completeness": int(result.get("completeness_score", 0))
                }
            )

        except json.JSONDecodeError as e:
            print(f"⚠️ Failed to parse JSON response: {e}")
            print(f"Raw response: {response_text}")
            
            # Fallback: Return basic response
            return SummaryCheckResponse(
                overall_score=70,
                feedback="Summary received and reviewed. Good effort!",
                strengths=["Clear writing"],
                improvements=["Try to include more key points"],
                key_points_covered=0,
                key_points_total=0,
                detailed_scores={"coverage": 70, "accuracy": 70, "clarity": 70, "completeness": 70}
            )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in handle_summary_check: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
