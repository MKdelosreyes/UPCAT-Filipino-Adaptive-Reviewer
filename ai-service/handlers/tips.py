from pydantic import BaseModel
from typing import Optional
import os
from openai import OpenAI

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class TipsRequest(BaseModel):
    score: int
    missedLowFreq: int
    similarChoiceErrors: int
    lastDifficulty: str
    module: str


class TipsResponse(BaseModel):
    tips: str


def tips_prompt(data: dict) -> str:
    """
    Generate a concise prompt for personalized study tips.
    """
    module_map = {
        "vocabulary": "vocab",
        "grammar": "grammar",
        "sentence-construction": "sentences",
        "reading-comprehension": "reading"
    }

    module = module_map.get(data["module"], data["module"])

    prompt = f"""Filipino {module} tutor for UPCAT prep. Student stats:
- Score: {data["score"]}%
- Missed rare words: {data["missedLowFreq"]}
- Confused similar options: {data["similarChoiceErrors"]}
- Level: {data["lastDifficulty"]}

Give brief tips in this format:

**📊 Analysis** (1-2 sentences on strengths/weaknesses)

**💡 Focus Areas** (3 bullet points with emojis)

**🎯 Next Steps** (recommended difficulty + 1 tip)

Keep concise, practical, encouraging."""

    return prompt


async def handle_tips(request: TipsRequest) -> TipsResponse:
    """
    Generate personalized study tips based on student performance.
    """
    try:
        # Generate prompt
        prompt = tips_prompt(request.dict())

        # Call OpenAI
        completion = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.7,
            max_tokens=400,
            messages=[
                {
                    "role": "system",
                    # ✅ Shorter system message
                    "content": "You are a Filipino language tutor. Give brief, practical study tips."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        tips = completion.choices[0].message.content or "Unable to generate tips at this time."

        return TipsResponse(tips=tips)

    except Exception as e:
        print(f"❌ Error generating tips: {e}")
        # Return fallback tips
        fallback_tips = generate_fallback_tips(request.dict())
        return TipsResponse(tips=fallback_tips)


def generate_fallback_tips(data: dict) -> str:
    """
    Generate basic tips when AI service fails.
    """
    score = data["score"]
    missed_low_freq = data["missedLowFreq"]
    similar_errors = data["similarChoiceErrors"]

    tips = "📊 **Analysis**\n"
    tips += "Good effort! " if score >= 60 else "Keep practicing! "

    tips += "\n\n💡 **Focus Areas**\n"

    if missed_low_freq > 2:
        tips += "• 📚 Study uncommon words\n"
    if similar_errors > 2:
        tips += "• 🔍 Practice distinguishing similar options\n"
    if score < 70:
        tips += "• 📖 Review fundamentals\n"

    tips += f"\n📅 **15-Min Plan**\n"
    tips += "• 0-5 min: Review missed words\n"
    tips += "• 5-10 min: Practice exercises\n"
    tips += "• 10-15 min: Read examples\n"

    tips += f"\n🎯 **Next:** Continue at {data['lastDifficulty']} level"

    return tips
