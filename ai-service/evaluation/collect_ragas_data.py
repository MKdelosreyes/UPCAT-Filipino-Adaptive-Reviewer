from handlers.explain import handle_explain, ExplainRequest
from dotenv import load_dotenv
import json
import asyncio
from typing import List, Dict
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

groq_key = os.getenv("GROQ_API_KEY")
if not groq_key:
    print("❌ ERROR: GROQ_API_KEY not found in environment!")
    sys.exit(1)
else:
    print(f"✅ GROQ_API_KEY loaded: {groq_key[: 20]}...")


async def collect_single_sample(
    sample_id: str,
    mode: str,
    word: str,
    correct:  str,
    selected:  str,
    sentence:  str = None,
    ground_truth: str = "",  # NEW: Add ground truth parameter
) -> Dict:
    """
    Collect ONE evaluation sample with retrieved context
    """
    print(f"📝 Processing:  {sample_id}...")

    request = ExplainRequest(
        mode=mode,
        word=word,
        correct=correct,
        selected=selected,
        sentence=sentence
    )

    response = await handle_explain(request, return_chunks=True)

    retrieved_context_list = []
    if response.retrieved_context:
        for chunk in response.retrieved_context:
            source = chunk['source_type']
            content = chunk['content']

            if source == "vocabulary":
                # Include more details from vocabulary
                lemma = content.get('lemma', '')
                definition = content.get('definition', '')
                synonyms = content.get('synonyms', [])
                antonyms = content.get('antonyms', [])

                text = f"[VOCABULARY] {lemma}:  {definition}"
                if synonyms:
                    text += f" Mga kasingkahulugan: {', '.join(synonyms)}."
                if antonyms:
                    text += f" Mga kasalungat: {', '.join(antonyms)}."

            elif source == "grammar":
                rule_name = content.get('rule_name', content.get('name', ''))
                description = content.get('description', '')
                examples = content.get('examples', [])

                text = f"[GRAMMAR] {rule_name}: {description}"
                if examples and isinstance(examples, list) and len(examples) > 0:
                    if isinstance(examples[0], dict):
                        example_text = examples[0].get(
                            'Filipino', examples[0].get('example', ''))
                        if example_text:
                            text += f" Halimbawa: {example_text}"
                    elif isinstance(examples[0], str):
                        text += f" Halimbawa:  {examples[0]}"

            elif source == "mistakes":
                error_name = content.get('error_name', '')
                description = content.get('description', '')
                examples = content.get('examples', {})

                text = f"[COMMON MISTAKE] {error_name}: {description}"
                if examples:
                    incorrect = examples.get('incorrect', [])
                    correct_ex = examples.get('correct', [])
                    if incorrect and correct_ex:
                        text += f" Mali: {incorrect[0] if incorrect else ''} Tama: {correct_ex[0] if correct_ex else ''}"
            else:
                text = str(content)

            retrieved_context_list.append(text)

    sample = {
        "id": sample_id,
        "exercise_type": mode,
        "word": word,  # NEW: Include the word
        "correct_answer": correct,
        "student_answer": selected,
        "contexts": retrieved_context_list,
        "answer": response.explanation,
        "ground_truth":  ground_truth,  # NEW: Include ground truth
        "retrieval_metadata": response.retrieval_metadata
    }

    print(
        f"✅ Completed: {sample_id} (contexts: {len(retrieved_context_list)})")
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
        word="",
        correct="Walang Mali",
        selected="buhay ay",
        sentence="Ang kanyang buhay ay parang pinagtagpi-tagping kwento ng tagumpay at kabiguan."
    )
    samples.append(item1)

    item2 = await collect_single_sample(
        sample_id="gram_002",
        mode="error-identification",
        word="",
        correct="hikahos kalagayan",
        selected="nabubuhay sa",
        sentence="Maraming pamilya ang nabubuhay sa hikahos kalagayan."
    )
    samples.append(item2)

    item3 = await collect_single_sample(
        sample_id="gram_003",
        mode="error-identification",
        word="",
        correct="binalibag",
        selected="Walang Mali",
        sentence="Sa sobrang galit, binalibag niya ang telepono sa pader."
    )
    samples.append(item3)

    item4 = await collect_single_sample(
        sample_id="gram_004",
        mode="error-identification",
        word="",
        correct="Walang Mali",
        selected="sa social",
        sentence="Naglipana ang mga pekeng balita sa social media."
    )
    samples.append(item4)

    item5 = await collect_single_sample(
        sample_id="gram_005",
        mode="error-identification",
        word="",
        correct="matingkad na kulay",
        selected="Walang Mali",
        sentence="Pinatingkad ng ilaw ang matingkad na kulay ng kanyang damit."
    )
    samples.append(item5)

    # =========== FILL THE BLANK ITEMS ==========
    item6 = await collect_single_sample(
        sample_id="gram_006",
        mode="fill-blanks",
        word="",
        correct="pagbabaklas",
        selected="baklasin",
        sentence="Sila ay nagtutulong-tulong sa ______ ng kanilang mga tolda matapos ang camping."
    )
    samples.append(item6)

    item7 = await collect_single_sample(
        sample_id="gram_007",
        mode="fill-blanks",
        word="",
        correct="mabagabag",
        selected="bagabag",
        sentence="Huwag kang_______; malulutas din natin ang problemang ito."
    )
    samples.append(item7)

    item8 = await collect_single_sample(
        sample_id="gram_008",
        mode="fill-blanks",
        word="",
        correct="kahapuan",
        selected="nahahapo",
        sentence="Ang _____ na kanyang nararamdaman ay dulot ng kulang sa tulog."
    )
    samples.append(item8)

    item9 = await collect_single_sample(
        sample_id="gram_009",
        mode="fill-blanks",
        word="",
        correct="apuhapin",
        selected="inaapuhap",
        sentence="Subukan mong _______ sa iyong isipan ang sagot sa tanong."
    )
    samples.append(item9)

    item10 = await collect_single_sample(
        sample_id="gram_010",
        mode="fill-blanks",
        word="",
        correct="nabiyayaan",
        selected="mabiyaya",
        sentence="Siya ay _____ ng isang magandang pamilya."
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

    # Print summary of contexts
    empty_contexts = sum(1 for s in samples if not s['contexts'])
    print(f"\n📊 Summary:")
    print(
        f"   - Samples with contexts: {len(samples) - empty_contexts}/{len(samples)}")
    print(f"   - Samples without contexts: {empty_contexts}/{len(samples)}")

    return samples


if __name__ == "__main__":
    asyncio.run(collect_evaluation_dataset())
