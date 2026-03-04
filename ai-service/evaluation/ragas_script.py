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
    model="meta-llama/llama-4-maverick-17b-128e-instruct",
    temperature=0.0,
    groq_api_key=groq_key
)

print(f"✅ Using Groq (meta-llama/llama-4-maverick-17b-128e-instruct) for RAGAS evaluation")


def prepare_ragas_dataset(evaluation_data):
    """
    Prepare evaluation data in RAGAS-compatible format. 
    """
    ragas_data = {
        "user_input": [],
        "response": [],
        "retrieved_contexts": [],
        "reference":  []
    }

    for sample in evaluation_data:
        exercise_type = sample. get("exercise_type", "")
        correct_answer = sample.get("correct_answer", "")
        student_answer = sample.get("student_answer", "")

        # Get the word from retrieval_metadata query or extract from context
        query = sample.get("retrieval_metadata", {}).get("query", "")

        # Extract the actual word being tested
        word = ""
        if "Filipino word:" in query:
            word = query.split("Filipino word:")[1].split(". ")[0].strip()
        elif "salita:" in query:
            parts = query.split("salita:")
            if len(parts) > 1:
                word = parts[1].split()[0].strip()

        # Build question based on exercise type with actual values
        if exercise_type == "quiz":
            if word:
                question = f"Bakit '{correct_answer}' ang tamang kasingkahulugan ng '{word}' at hindi '{student_answer}'?"
            else:
                question = f"Bakit '{correct_answer}' ang tamang sagot at hindi '{student_answer}'?"

        elif exercise_type == "antonym":
            if word:
                question = f"Bakit '{correct_answer}' ang tamang kasalungat ng '{word}' at hindi '{student_answer}'?"
            else:
                question = f"Bakit '{correct_answer}' ang tamang kasalungat at hindi '{student_answer}'?"

        elif exercise_type == "error-identification":
            question = f"Ano ang mali sa pangungusap at bakit '{correct_answer}' ang tamang sagot sa halip na '{student_answer}'?"

        elif exercise_type == "fill-blanks":
            question = f"Bakit '{correct_answer}' ang tamang salita para sa patlang at hindi '{student_answer}'?"

        elif exercise_type == "sentence-ordering":
            question = f"Bakit '{correct_answer}' ang tamang pagkakasunod-sunod ng pangungusap?"

        elif exercise_type == "choose-sentence":
            question = f"Bakit '{correct_answer}' ang pinakamainam na pangungusap para sa konteksto at hindi '{student_answer}'?"

        elif exercise_type == "reading-comprehension":
            question = f"Batay sa teksto, bakit '{correct_answer}' ang tamang sagot at hindi '{student_answer}'?"

        else:
            question = f"Bakit mali ang sagot na '{student_answer}' at '{correct_answer}' ang tama?"

        ragas_data["user_input"].append(question)
        ragas_data["response"].append(sample["answer"])
        ragas_data["retrieved_contexts"].append(sample["contexts"])
        ragas_data["reference"].append(sample. get("ground_truth", ""))

    return Dataset.from_dict(ragas_data)


def evaluate_ragas(evaluation_data):
    """
    Run RAGAS evaluation using Groq LLM
    """
    # Filter out samples with empty contexts for more meaningful evaluation
    valid_samples = [s for s in evaluation_data if s. get(
        "contexts") and len(s["contexts"]) > 0]

    if len(valid_samples) < len(evaluation_data):
        print(
            f"⚠️ Warning: {len(evaluation_data) - len(valid_samples)} samples have empty contexts and may affect scores")

    # Prepare dataset
    dataset = prepare_ragas_dataset(evaluation_data)

    # Define metrics - only use metrics that work without ground_truth if needed
    has_ground_truth = any(s.get("ground_truth") for s in evaluation_data)

    if has_ground_truth:
        metrics = [
            faithfulness,
            answer_relevancy,
            context_precision,
            context_recall
        ]
    else:
        print("⚠️ Warning:  No ground_truth found. context_recall may not work properly.")
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

    return results. to_pandas()


def load_evaluation_dataset(file_path="evaluation_dataset.json"):
    """
    Load evaluation dataset from JSON file
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset file not found:  {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"✅ Loaded {len(data)} samples from {file_path}")

    # Print diagnostic info
    empty_contexts = sum(1 for s in data if not s.get(
        "contexts") or len(s["contexts"]) == 0)
    empty_ground_truth = sum(1 for s in data if not s.get("ground_truth"))

    print(f"📊 Samples with empty contexts: {empty_contexts}/{len(data)}")
    print(
        f"📊 Samples with empty ground_truth: {empty_ground_truth}/{len(data)}")

    return data


if __name__ == "__main__":
    print("="*60)
    print("🚀 RAGAS Evaluation Script (Using Groq)")
    print("="*60)

    dataset_path = os.path.join(os.path.dirname(
        __file__), "evaluation_dataset.json")
    evaluation_data = load_evaluation_dataset(dataset_path)

    print("\n📊 Overall RAGAS Evaluation:")
    print("-" * 60)

    try:
        results_df = evaluate_ragas(evaluation_data)

        # Calculate mean scores (ignoring NaN)
        print("\n✅ RAGAS Evaluation Results (Overall):")
        print(
            f"  Faithfulness:        {results_df['faithfulness']. mean():.4f}")
        print(
            f"  Answer Relevancy:   {results_df['answer_relevancy'].mean():.4f}")
        print(
            f"  Context Precision:  {results_df['context_precision'].mean():.4f}")
        print(
            f"  Context Recall:     {results_df['context_recall'].mean():.4f}")

        results_df['sample_id'] = [sample['id'] for sample in evaluation_data]
        results_df['exercise_type'] = [sample['exercise_type']
                                       for sample in evaluation_data]

        detailed_output_path = os.path.join(
            os.path.dirname(__file__), "ragas_detailed_results.csv")
        results_df.to_csv(detailed_output_path, index=False)
        print(f"\n💾 Detailed results saved to: {detailed_output_path}")

        print("\n" + "="*60)
        print("📊 RAGAS Evaluation by Exercise Type:")
        print("="*60)

        grouped = results_df.groupby('exercise_type').agg({
            'faithfulness': 'mean',
            'answer_relevancy':  'mean',
            'context_precision': 'mean',
            'context_recall': 'mean'
        }).round(4)

        grouped['n_samples'] = results_df. groupby('exercise_type').size()
        grouped = grouped[['n_samples', 'faithfulness',
                           'answer_relevancy', 'context_precision', 'context_recall']]

        print("\n📈 Results by Exercise Type:")
        print(grouped. to_string())

        output_path = os.path.join(
            os.path.dirname(__file__), "ragas_results.csv")
        grouped.to_csv(output_path)
        print(f"\n💾 Grouped results saved to: {output_path}")

        print("\n" + "="*60)
        print("✅ RAGAS Evaluation Complete!")
        print("="*60)

    except Exception as e:
        print(f"\n❌ Error during evaluation: {e}")
        import traceback
        traceback.print_exc()
