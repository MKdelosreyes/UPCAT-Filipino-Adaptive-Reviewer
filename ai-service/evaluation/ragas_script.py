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
from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()

# Configure RAGAS to use Groq
groq_key = os.getenv("GROQ_API_KEY")
if not groq_key:
    print("❌ ERROR: GROQ_API_KEY not found!")
    exit(1)

# Create Groq LLM for RAGAS
evaluator_llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.0,
    groq_api_key=groq_key
)

print(f"✅ Using Groq (llama-3.1-8b-instant) for RAGAS evaluation")


def prepare_ragas_dataset(evaluation_data):
    """
    Prepare evaluation data in RAGAS-compatible format.
    """
    ragas_data = {
        "question": [],
        "answer": [],
        "contexts": [],
        "ground_truth": []
    }

    for sample in evaluation_data:
        # Build question based on exercise type
        exercise_type = sample.get("exercise_type", "")

        if exercise_type == "quiz":
            question = f"Ano ang kahulugan ng salitang '{sample.get('word', 'N/A')}'?"
        elif exercise_type == "antonym":
            question = f"Ano ang kasalungat ng salitang '{sample.get('word', 'N/A')}'?"
        elif exercise_type in ["fill-blanks", "error-identification"]:
            question = f"Ano ang tamang salita/bahagi sa pangungusap: '{sample.get('sentence', 'N/A')}'?"
        elif exercise_type == "reading-comprehension":
            question = sample.get("question", "N/A")
        elif exercise_type == "sentence-ordering":
            question = f"Ano ang tamang pagkakasunod-sunod ng mga salita sa pangungusap?"
        elif exercise_type == "choose-sentence":
            question = f"Aling pangungusap ang pinakamainam para sa konteksto: '{sample.get('context', 'N/A')}'?"
        else:
            question = f"Bakit mali ang sagot na '{sample['student_answer']}'?"

        ragas_data["question"].append(question)
        ragas_data["answer"].append(sample["answer"])
        ragas_data["contexts"].append(sample["contexts"])
        ragas_data["ground_truth"].append(sample["ground_truth"])

    return Dataset.from_dict(ragas_data)


def evaluate_ragas(evaluation_data):
    """
    Run RAGAS evaluation using Groq LLM
    """
    # Prepare dataset
    dataset = prepare_ragas_dataset(evaluation_data)

    # Define metrics
    metrics = [
        faithfulness,
        answer_relevancy,
        context_precision,
        context_recall
    ]

    # Run evaluation with custom LLM
    print("🔄 Running RAGAS evaluation with Groq...")
    print(f"📊 Evaluating {len(evaluation_data)} samples...")

    results = evaluate(
        dataset=dataset,
        metrics=metrics,
        llm=evaluator_llm
    )

    # Convert to pandas DataFrame for easier access
    return results.to_pandas()


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
    print("🚀 RAGAS Evaluation Script (Using Groq)")
    print("="*60)

    # Load your evaluation dataset
    dataset_path = os.path.join(os.path.dirname(
        __file__), "evaluation_dataset.json")
    evaluation_data = load_evaluation_dataset(dataset_path)

    # Option 1: Evaluate all samples together
    print("\n📊 Overall RAGAS Evaluation:")
    print("-" * 60)

    try:
        results_df = evaluate_ragas(evaluation_data)

        # Calculate mean scores
        print("\n✅ RAGAS Evaluation Results (Overall):")
        print(f"  Faithfulness:       {results_df['faithfulness'].mean():.4f}")
        print(
            f"  Answer Relevancy:   {results_df['answer_relevancy'].mean():.4f}")
        print(
            f"  Context Precision:  {results_df['context_precision'].mean():.4f}")
        print(
            f"  Context Recall:     {results_df['context_recall'].mean():.4f}")

        # Add sample metadata
        results_df['sample_id'] = [sample['id'] for sample in evaluation_data]
        results_df['exercise_type'] = [sample['exercise_type']
                                       for sample in evaluation_data]

        # Save detailed results
        detailed_output_path = os.path.join(
            os.path.dirname(__file__), "ragas_detailed_results.csv")
        results_df.to_csv(detailed_output_path, index=False)
        print(f"\n💾 Detailed results saved to: {detailed_output_path}")

        # Option 2: Group by exercise type
        print("\n" + "="*60)
        print("📊 RAGAS Evaluation by Exercise Type:")
        print("="*60)

        grouped = results_df.groupby('exercise_type').agg({
            'faithfulness': 'mean',
            'answer_relevancy': 'mean',
            'context_precision': 'mean',
            'context_recall': 'mean'
        }).round(4)

        # Add sample count
        grouped['n_samples'] = results_df.groupby('exercise_type').size()

        # Reorder columns
        grouped = grouped[['n_samples', 'faithfulness',
                           'answer_relevancy', 'context_precision', 'context_recall']]

        print("\n📈 Results by Exercise Type:")
        print(grouped.to_string())

        # Save grouped results
        output_path = os.path.join(
            os.path.dirname(__file__), "ragas_results.csv")
        grouped.to_csv(output_path)
        print(f"\n💾 Grouped results saved to: {output_path}")

        # Option 3: Show sample-level results (first 10)
        print("\n" + "="*60)
        print("📋 Sample-level Results (first 10 samples):")
        print("="*60)

        display_cols = ['sample_id', 'exercise_type', 'faithfulness',
                        'answer_relevancy', 'context_precision', 'context_recall']
        print("\n" + results_df[display_cols].head(10).to_string(index=False))

        print("\n" + "="*60)
        print("✅ RAGAS Evaluation Complete!")
        print("="*60)

    except Exception as e:
        print(f"\n❌ Error during evaluation: {e}")
        import traceback
        traceback.print_exc()
