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

    # =========== CLOSEST MEANING ITEMS ==========
    item1 = await collect_single_sample(
        sample_id="vocab_001",
        mode="quiz",
        word="nagbunsod",
        correct="sanhi",
        selected="kaagapay",
        ground_truth="Ang 'sanhi' ang tamang kasingkahulugan ng 'nagbunsod' dahil ang 'bunsod' ay nangangahulugang dahilan o sanhi na nagtutulak sa isang pangyayari.  Ang 'kaagapay' naman ay tumutukoy sa kasama o katuwang, na walang kaugnayan sa kahulugan ng 'bunsod'."
    )
    samples.append(item1)

    item2 = await collect_single_sample(
        sample_id="vocab_002",
        mode="quiz",
        word="simbuyo",
        correct="silakbo",
        selected="nilalakbay",
        ground_truth="Ang 'silakbo' ang tamang kasingkahulugan ng 'simbuyo' dahil pareho silang tumutukoy sa biglaan at matinding pagbulas ng damdamin. Ang 'nilalakbay' ay tumutukoy sa dinaraanan o tinatahak na landas, na ibang-iba ang kahulugan."
    )
    samples.append(item2)

    item3 = await collect_single_sample(
        sample_id="vocab_003",
        mode="quiz",
        word="susog",
        correct="siyasat",
        selected="dalampasigan",
        ground_truth="Ang 'siyasat' ang tamang kasingkahulugan ng 'susog' dahil ito ay tumutukoy sa pagsusuri o pag-eeksamen ng dokumento.  Ang 'dalampasigan' ay tumutukoy sa baybayin, na walang kaugnayan sa 'susog'."
    )
    samples.append(item3)

    item4 = await collect_single_sample(
        sample_id="vocab_004",
        mode="quiz",
        word="silakbo",
        correct="matindi",
        selected="kariktan",
        ground_truth="Ang 'matindi' ang tamang kasingkahulugan ng 'silakbo' dahil ang silakbo ay tumutukoy sa matinding pagbulas ng damdamin. Ang 'kariktan' ay tumutukoy sa kagandahan, na hindi kaugnay sa kahulugan ng 'silakbo'."
    )
    samples.append(item4)

    item5 = await collect_single_sample(
        sample_id="vocab_005",
        mode="quiz",
        word="pagtangis",
        correct="pagluha",
        selected="maalab",
        ground_truth="Ang 'pagluha' ang tamang kasingkahulugan ng 'pagtangis' dahil pareho silang tumutukoy sa pag-iyak.  Ang 'maalab' ay pang-uri na tumutukoy sa matinding sigla, na ibang-iba ang kahulugan."
    )
    samples.append(item5)

    # =========== ANTONYM ITEMS ==========
    item6 = await collect_single_sample(
        sample_id="vocab_006",
        mode="antonym",
        word="nagkamal",
        correct="nagwaldas",
        selected="humpay",
        ground_truth="Ang 'nagwaldas' ang tamang kasalungat ng 'nagkamal' dahil ang 'nagkamal' ay nangangahulugang nag-ipon, samantalang ang 'nagwaldas' ay nangangahulugang nag-aksaya.  Ang 'humpay' ay tumutukoy sa pagtigil, na hindi direktang kasalungat."
    )
    samples.append(item6)

    item7 = await collect_single_sample(
        sample_id="vocab_007",
        mode="antonym",
        word="biyaya",
        correct="kapinsalan",
        selected="ilanlang",
        ground_truth="Ang 'kapinsalan' ang tamang kasalungat ng 'biyaya' dahil ang 'biyaya' ay tumutukoy sa pagpapala, samantalang ang 'kapinsalan' ay tumutukoy sa pinsala.  Ang 'ilanlang' ay tumutukoy sa bagay na nakakalat sa hangin, na walang kaugnayan."
    )
    samples.append(item7)

    item8 = await collect_single_sample(
        sample_id="vocab_008",
        mode="antonym",
        word="pagtalima",
        correct="sumuway",
        selected="tuyot",
        ground_truth="Ang 'sumuway' ang tamang kasalungat ng 'pagtalima' dahil ang 'pagtalima' ay tumutukoy sa pagsunod, samantalang ang 'sumuway' ay tumutukoy sa hindi pagsunod.  Ang 'tuyot' ay pang-uri na tumutukoy sa kawalan ng tubig, na walang kaugnayan."
    )
    samples.append(item8)

    item9 = await collect_single_sample(
        sample_id="vocab_009",
        mode="antonym",
        word="alindog",
        correct="kapangitan",
        selected="marubdob",
        ground_truth="Ang 'kapangitan' ang tamang kasalungat ng 'alindog' dahil ang 'alindog' ay tumutukoy sa kagandahan, samantalang ang 'kapangitan' ay tumutukoy sa kawalan ng ganda. Ang 'marubdob' ay pang-uri na tumutukoy sa matinding damdamin, na hindi kasalungat."
    )
    samples.append(item9)

    item10 = await collect_single_sample(
        sample_id="vocab_010",
        mode="antonym",
        word="nabalisa",
        correct="kalmado",
        selected="hiyas",
        ground_truth="Ang 'kalmado' ang tamang kasalungat ng 'nabalisa' dahil ang 'nabalisa' ay tumutukoy sa pagkabalisa, samantalang ang 'kalmado' ay tumutukoy sa katahimikan.  Ang 'hiyas' ay pangngalan na tumutukoy sa alahas, na walang kaugnayan."
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
