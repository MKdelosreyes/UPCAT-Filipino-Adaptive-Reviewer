from handlers.explain import handle_explain, ExplainRequest
from dotenv import load_dotenv
import json
import asyncio
from typing import List, Dict
import sys
import os

# Add parent directory to path FIRST
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

# Verify API key is loaded
groq_key = os.getenv("GROQ_API_KEY")
if not groq_key:
    print("❌ ERROR: GROQ_API_KEY not found in environment!")
    print("📁 Current directory:", os.getcwd())
    print("🔍 Looking for .env at:", os.path.join(
        os.path.dirname(os.path.dirname(__file__)), ".env"))
    sys.exit(1)
else:
    print(f"✅ GROQ_API_KEY loaded: {groq_key[:20]}...")

# NOW import handlers after env vars are loaded


async def collect_single_sample(
    sample_id: str,
    mode: str,
    word: str,
    correct: str,
    selected: str,
    sentence: str = None,
) -> Dict:
    """
    Collect ONE evaluation sample with retrieved context
    """

    print(f"📝 Processing: {sample_id}...")

    # Create request just like your frontend does
    request = ExplainRequest(
        mode=mode,
        word=word,
        correct=correct,
        selected=selected,
        sentence=sentence
    )

    # Call your handler WITH return_chunks=True to get context
    response = await handle_explain(request, return_chunks=True)

    # Format retrieved context for RAGAS (convert chunks to text)
    retrieved_context_list = []
    if response.retrieved_context:
        for chunk in response.retrieved_context:
            # Convert chunk dict to readable text
            source = chunk['source_type']
            content = chunk['content']

            # Format based on source type
            if source == "vocabulary":
                text = f"[VOCABULARY] {content.get('lemma', '')}: {content.get('definition', '')}"
            elif source == "grammar":
                text = f"[GRAMMAR] {content.get('rule_name', '')}: {content.get('description', '')}"
            elif source == "mistakes":
                text = f"[COMMON MISTAKE] {content.get('error_name', '')}: {content.get('description', '')}"
            else:
                text = str(content)

            retrieved_context_list.append(text)

    # Create sample in RAGAS format
    sample = {
        "id": sample_id,
        "exercise_type": mode,
        "correct_answer": correct,
        "student_answer": selected,

        # For RAGAS: contexts should be list of strings
        "contexts": retrieved_context_list,

        # For RAGAS: answer is what AI generated
        "answer": response.explanation,

        # For RAGAS: ground_truth needs to be filled by expert
        "ground_truth": "",  # You'll fill this manually later

        # Extra metadata
        "retrieval_metadata": response.retrieval_metadata
    }

    print(f"✅ Completed: {sample_id}")
    return sample


async def collect_evaluation_dataset():
    """
    Collect multiple samples for evaluation
    """
    samples = []

    print("\n" + "="*60)
    print("🚀 Starting evaluation data collection...")
    print("="*60 + "\n")

    # =========== ERROR IDENTIFICATION ITEMS ==========
    item1 = await collect_single_sample(
        sample_id="gram_001",
        mode="error-identification",
        word="Walang Mali",
        correct="Walang Mali",
        selected="buhay ay",
    )
    samples.append(item1)

    item2 = await collect_single_sample(
        sample_id="gram_002",
        mode="error-identification",
        word="hikahos kalagayan",
        correct="hikahos kalagayan",
        selected="nabubuhay sa",
    )
    samples.append(item2)

    item3 = await collect_single_sample(
        sample_id="gram_003",
        mode="error-identification",
        word="binalibag",
        correct="binalibag",
        selected="Walang Mali",
    )
    samples.append(item3)

    item4 = await collect_single_sample(
        sample_id="gram_004",
        mode="error-identification",
        word="Walang Mali",
        correct="Walang Mali",
        selected="sa social",
    )
    samples.append(item4)

    item5 = await collect_single_sample(
        sample_id="gram_005",
        mode="error-identification",
        word="matingkad na kulay",
        correct="matingkad na kulay",
        selected="Walang Mali",
    )
    samples.append(item5)

    # =========== ANTONYM ITEMS ==========
    item6 = await collect_single_sample(
        sample_id="gram_006",
        mode="fill-blanks",
        word="pagbabaklas",
        correct="pagbabaklas",
        selected="baklasin",
    )
    samples.append(item6)

    item7 = await collect_single_sample(
        sample_id="gram_007",
        mode="fill-blanks",
        word="mabagabag",
        correct="mabagabag",
        selected="bagabag",
    )
    samples.append(item7)

    item8 = await collect_single_sample(
        sample_id="gram_008",
        mode="fill-blanks",
        word="kahapuan",
        correct="kahapuan",
        selected="nahahapo",
    )
    samples.append(item8)

    item9 = await collect_single_sample(
        sample_id="gram_009",
        mode="fill-blanks",
        word="apuhapin",
        correct="apuhapin",
        selected="inaapuhap",
    )
    samples.append(item9)

    item10 = await collect_single_sample(
        sample_id="gram_010",
        mode="fill-blanks",
        word="nabiyayaan",
        correct="nabiyayaan",
        selected="mabiyaya",
    )
    samples.append(item10)

    # Save to JSON file
    output_file = os.path.join(os.path.dirname(
        __file__), "evaluation_dataset.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(samples, f, ensure_ascii=False, indent=2)

    print("\n" + "="*60)
    print(f"✅ Successfully collected {len(samples)} evaluation samples")
    print(f"💾 Saved to: {output_file}")
    print("="*60)
    print(f"\n📋 Next steps:")
    print(f"1. Review the generated JSON file")
    print(f"2. Ask Filipino language experts to fill the 'ground_truth' field")
    print(f"3. Each 'ground_truth' should be the IDEAL explanation")
    print(f"4. Use the completed dataset with RAGAS to evaluate your AI")

    return samples


if __name__ == "__main__":
    # Run the collection
    asyncio.run(collect_evaluation_dataset())
