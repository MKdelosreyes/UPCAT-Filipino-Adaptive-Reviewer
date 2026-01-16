from handlers.explain import handle_explain, ExplainRequest
import json
import asyncio
from typing import List, Dict
import sys
import os

# Add parent directory to path to import handlers
sys.path.append(os.path.dirname(os.path.dirname(__file__)))


async def collect_single_sample(
    sample_id: str,
    mode: str,
    word: str,
    correct: str,
    selected: str,
    sentence: str = None,
    question: str = None,
    choices: List[str] = None
) -> Dict:
    """
    Collect ONE evaluation sample with retrieved context

    This calls your actual AI service and captures:
    - The question
    - What RAG retrieved
    - What the AI generated
    """

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
                text = f"Word: {content.get('lemma', '')}\nDefinition: {content.get('definition', '')}"
            elif source == "grammar":
                text = f"Rule: {content.get('rule_name', '')}\n{content.get('description', '')}"
            elif source == "mistakes":
                text = f"Error: {content.get('error_name', '')}\n{content.get('description', '')}"
            else:
                text = str(content)

            retrieved_context_list.append(text)

    # Create sample in RAGAS format
    sample = {
        "id": sample_id,
        "exercise_type": mode,
        "question": question or f"Ano ang kahulugan ng salitang '{word}'?",
        "choices": choices or [],
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

    return sample


async def collect_evaluation_dataset():
    """
    Collect multiple samples for evaluation

    Add your own test cases here!
    """
    samples = []

    # Example 1: Vocabulary quiz
    sample1 = await collect_single_sample(
        sample_id="vocab_001",
        mode="quiz",
        word="adhika",
        correct="B. Hangarin",
        selected="A. Pagkain",
        question="Ano ang kahulugan ng salitang 'adhika'?",
        choices=["A. Pagkain", "B. Hangarin", "C. Bahay", "D. Aklat"]
    )
    samples.append(sample1)

    # Example 2: Grammar fill-blanks
    sample2 = await collect_single_sample(
        sample_id="grammar_001",
        mode="fill-blanks",
        word="ng",
        correct="ng",
        selected="nang",
        sentence="Kumain ako ___ gulay kaninang umaga.",
        question="Piliin ang tamang salita para punan ang patlang"
    )
    samples.append(sample2)

    # Add more samples here...

    # Save to JSON file
    output_file = "evaluation_dataset.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(samples, f, ensure_ascii=False, indent=2)

    print(f"✅ Collected {len(samples)} samples")
    print(f"💾 Saved to: {output_file}")
    print(f"\n📋 Next steps:")
    print(f"1. Review the file: {output_file}")
    print(f"2. Ask Filipino experts to fill in 'ground_truth' field")
    print(f"3. Use the file with RAGAS for evaluation")

    return samples


if __name__ == "__main__":
    # Run the collection
    asyncio.run(collect_evaluation_dataset())
