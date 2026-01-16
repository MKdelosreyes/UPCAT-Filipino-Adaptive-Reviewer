from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall
)
from datasets import Dataset
import pandas as pd
import json
import os


def prepare_ragas_dataset(evaluation_data):
    """
    Prepare evaluation data in RAGAS-compatible format.

    RAGAS expects: 
    - question: The input query
    - answer: The generated answer
    - contexts: List of retrieved context chunks (list of lists)
    - ground_truth: The reference/expected answer
    """
    ragas_data = {
        "question": [],
        "answer": [],
        "contexts": [],
        "ground_truth": []
    }

    for sample in evaluation_data:
        # Construct the question/query that triggered the explanation
        question = f"Bakit mali ang sagot na '{sample['student_answer']}' para sa salitang '{sample.get('word', 'N/A')}'? Ano ang tamang sagot at bakit?"

        ragas_data["question"].append(question)
        # Changed from "generated_explanation"
        ragas_data["answer"].append(sample["answer"])

        # contexts must be a list of strings for each sample
        # Already a list in your data
        ragas_data["contexts"].append(sample["contexts"])

        ragas_data["ground_truth"].append(sample["ground_truth"])

    return Dataset.from_dict(ragas_data)


def evaluate_ragas(evaluation_data):
    """
    Run RAGAS evaluation on the dataset. 

    Returns:
        Dictionary with RAGAS metric scores
    """
    # Prepare dataset
    dataset = prepare_ragas_dataset(evaluation_data)

    # Define metrics to evaluate
    metrics = [
        faithfulness,
        answer_relevancy,
        context_precision,
        context_recall
    ]

    # Run evaluation
    print("🔄 Running RAGAS evaluation...")
    print(f"📊 Evaluating {len(evaluation_data)} samples...")

    results = evaluate(
        dataset=dataset,
        metrics=metrics
    )

    return results


def evaluate_by_exercise_type(evaluation_data):
    """
    Compute RAGAS metrics grouped by exercise type.
    """
    from collections import defaultdict
    grouped = defaultdict(list)

    for sample in evaluation_data:
        grouped[sample["exercise_type"]].append(sample)

    results = []
    for exercise_type, samples in grouped.items():
        print(f"\n📝 Evaluating {exercise_type}: {len(samples)} samples")
        scores = evaluate_ragas(samples)

        results.append({
            "exercise_type": exercise_type,
            "n_samples": len(samples),
            "faithfulness": scores["faithfulness"],
            "answer_relevancy": scores["answer_relevancy"],
            "context_precision": scores["context_precision"],
            "context_recall": scores["context_recall"]
        })

    return pd.DataFrame(results)


def load_evaluation_dataset(file_path="evaluation_dataset.json"):
    """
    Load evaluation dataset from JSON file
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset file not found: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"✅ Loaded {len(data)} samples from {file_path}")
    return data


# Main execution
if __name__ == "__main__":
    print("="*60)
    print("🚀 RAGAS Evaluation Script")
    print("="*60)

    # Load your evaluation dataset
    dataset_path = os.path.join(os.path.dirname(
        __file__), "evaluation_dataset.json")
    evaluation_data = load_evaluation_dataset(dataset_path)

    # Option 1: Evaluate all samples together
    print("\n📊 Overall RAGAS Evaluation:")
    print("-" * 60)
    overall_results = evaluate_ragas(evaluation_data)

    print("\n✅ RAGAS Evaluation Results (Overall):")
    print(f"  Faithfulness:       {overall_results['faithfulness']:.4f}")
    print(f"  Answer Relevancy:   {overall_results['answer_relevancy']:.4f}")
    print(f"  Context Precision:  {overall_results['context_precision']:.4f}")
    print(f"  Context Recall:     {overall_results['context_recall']:.4f}")

    # Option 2: Evaluate by exercise type
    print("\n" + "="*60)
    print("📊 RAGAS Evaluation by Exercise Type:")
    print("="*60)
    grouped_results = evaluate_by_exercise_type(evaluation_data)

    print("\n📈 Results by Exercise Type:")
    print(grouped_results.to_string(index=False))

    # Save results to CSV
    output_path = os.path.join(os.path.dirname(__file__), "ragas_results.csv")
    grouped_results.to_csv(output_path, index=False)
    print(f"\n💾 Results saved to: {output_path}")

    # Option 3: Get detailed results for individual samples
    print("\n" + "="*60)
    print("📋 Sample-level Results:")
    print("="*60)

    dataset = prepare_ragas_dataset(evaluation_data)
    detailed_results = evaluate(
        dataset=dataset,
        metrics=[faithfulness, answer_relevancy,
                 context_precision, context_recall]
    )

    # Convert to DataFrame for better viewing
    detailed_df = detailed_results.to_pandas()

    # Add sample IDs
    detailed_df['sample_id'] = [sample['id'] for sample in evaluation_data]
    detailed_df['exercise_type'] = [sample['exercise_type']
                                    for sample in evaluation_data]

    # Reorder columns
    cols = ['sample_id', 'exercise_type', 'faithfulness',
            'answer_relevancy', 'context_precision', 'context_recall']
    detailed_df = detailed_df[cols]

    print("\n📊 Detailed Results:")
    print(detailed_df.to_string(index=False))

    # Save detailed results
    detailed_output_path = os.path.join(
        os.path.dirname(__file__), "ragas_detailed_results.csv")
    detailed_df.to_csv(detailed_output_path, index=False)
    print(f"\n💾 Detailed results saved to: {detailed_output_path}")

    print("\n" + "="*60)
    print("✅ RAGAS Evaluation Complete!")
    print("="*60)
