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
    print("📁 Current directory:", os.getcwd())
    print("🔍 Looking for .env at:", os.path.join(
        os.path.dirname(os.path.dirname(__file__)), ".env"))
    sys.exit(1)
else:
    print(f"✅ GROQ_API_KEY loaded: {groq_key[:20]}...")


async def collect_single_sample(
    sample_id: str,
    mode: str,
    word: str = "",
    correct: str = "",
    selected: str = None,
    user_sentence: str = None,
    context: str = None,
    explanation: str = None
) -> Dict:
    """
    Collect ONE evaluation sample with retrieved context
    """

    print(f"📝 Processing: {sample_id} ({mode})...")

    # Map fields correctly depending on mode
    if mode == "sentence-ordering":
        req_selected = user_sentence  # Student's arranged sentence
        req_sentence = None  # No context needed
    elif mode == "choose-sentence":
        req_selected = user_sentence  # Student's chosen sentence
        req_sentence = context  # The context paragraph
    elif mode == "reading-comprehension":
        req_selected = selected  # Student's answer
        req_sentence = context  # Passage title or context
    else:
        req_selected = selected
        req_sentence = context

    request = ExplainRequest(
        mode=mode,
        word=word,
        correct=correct,
        selected=req_selected,
        explanation=explanation
    )

    # Call handler WITH return_chunks=True to get context
    response = await handle_explain(request, return_chunks=True)

    # Format retrieved context for RAGAS (convert chunks to text)
    retrieved_context_list = []
    if response.retrieved_context:
        for chunk in response.retrieved_context:
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
        "student_answer": user_sentence if user_sentence else selected,
        "contexts": retrieved_context_list,
        "answer": response.explanation,
        "ground_truth": "",
        "retrieval_metadata": response.retrieval_metadata or {}
    }

    chunks_count = len(retrieved_context_list)
    print(
        f"✅ Completed: {sample_id} - Retrieved {chunks_count} context chunks")
    return sample


async def collect_evaluation_dataset():
    """
    Collect multiple samples for evaluation
    """
    samples = []

    print("\n" + "="*60)
    print("🚀 Starting evaluation data collection...")
    print("="*60 + "\n")

    # =========== READING COMPREHENSION ITEMS ==========
    print("\n📚 Collecting Reading Comprehension samples...")

    item1 = await collect_single_sample(
        sample_id="sc_001",
        mode="reading-comprehension",
        word="Ano ang emosyong naghahari sa tula?",
        correct="Awa at dalamhati",
        selected="Galit at paghihiganti",
        explanation="Walang nais maghiganti, wala pinagsisihan ang manunulat, at walang pag-iisa na nais iparating ang manunulat.",
    )
    samples.append(item1)

    item2 = await collect_single_sample(
        sample_id="sc_002",
        mode="reading-comprehension",
        word="Ano ang ibig sabihin ng salitang pananggalang ayon sa pagkakagamit sa teksto?",
        correct="depensa",
        selected="hadlang",
        explanation="Ang mga pahina ng diyaryo ay ginamit na pantakip at panangga sa gutom at lamig ng bata. Ipinahihiwatig nito ang pananggalang bilang bagay na nagbibigay-proteksiyon o depensa.",
    )
    samples.append(item2)

    item3 = await collect_single_sample(
        sample_id="sc_003",
        mode="reading-comprehension",
        word="Ano daw ang nasayang ayon sa manunulat?",
        correct="makita ang mukha sa dyaryo",
        selected="pulso ng bata",
        explanation="Binanggit sa tula na “Sayang at di na siya masisilayan… ang sariling retratong naligaw,” na nagpapahiwatig na nasayang ang pagkakataon ng bata na makita ang sarili niyang larawan sa diyaryo.",
    )
    samples.append(item3)

    item4 = await collect_single_sample(
        sample_id="sc_004",
        mode="reading-comprehension",
        word="Ano ang sensilyo?",
        correct="barya",
        selected="bola",
        explanation="Ang sensilyo ay isang maliit na barya. Ginamit ito bilang paghahambing sa ulo ng bata na “gumulong” matapos ang aksidente.",
    )
    samples.append(item4)

    item5 = await collect_single_sample(
        sample_id="sc_005",
        mode="reading-comprehension",
        word="Bakit sensilyo ang ginawang paglalarawan sa ulo ng bata?",
        correct="Nagtatrabaho siya para sa kakarampot na pera",
        selected="Dahil para na itong makina na walang ibang alam kun'di ang magtrabaho",
        explanation="Ang paghahambing sa ulo bilang sensilyo ay sumasagisag sa buhay ng bata na umiikot sa maliit na halaga ng pera kaya maging sa kamatayan ay iniuugnay pa rin siya sa barya."
    )
    samples.append(item5)

    # =========== SUMMARY ==========
    # Count samples with contexts
    with_contexts = sum(1 for s in samples if s.get("contexts"))
    without_contexts = sum(1 for s in samples if not s.get("contexts"))

    # Save to JSON file
    output_file = os.path.join(os.path.dirname(
        __file__), "evaluation_dataset.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(samples, f, ensure_ascii=False, indent=2)

    print("\n" + "="*60)
    print(f"✅ Successfully collected {len(samples)} evaluation samples")
    print(f"   📊 Samples with context: {with_contexts}")
    print(f"   ⚠️  Samples without context: {without_contexts}")
    print(f"💾 Saved to: {output_file}")
    print("="*60)
    print(f"\n📋 Next steps:")
    print(f"1. Review the generated JSON file")
    print(f"2. Ask Filipino language experts to fill the 'ground_truth' field")
    print(f"3. Each 'ground_truth' should be the IDEAL explanation")
    print(f"4. Use the completed dataset with RAGAS to evaluate your AI")

    return samples


if __name__ == "__main__":
    asyncio.run(collect_evaluation_dataset())
