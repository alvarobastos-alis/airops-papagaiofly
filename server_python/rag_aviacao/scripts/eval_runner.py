# ==========================================
# AirOps AI — RAG Evaluation Runner
# Tests intent classification accuracy
# ==========================================

import json
import sys
from pathlib import Path
from collections import Counter

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from services.rag_pipeline import classify_intent
from rag_aviacao.scripts.eval_set import EVAL_SET


def run_intent_evaluation() -> dict:
    """Evaluate intent classification accuracy against the eval set."""
    print(f"\n{'='*60}")
    print(f"AirOps RAG — Intent Classification Evaluation")
    print(f"{'='*60}")
    print(f"Total questions: {len(EVAL_SET)}\n")

    correct = 0
    wrong = 0
    errors = []

    for q in EVAL_SET:
        result = classify_intent(q["question"])
        expected_intent = q.get("expected_intent")
        expected_topic = q.get("expected_topic")

        intent_ok = expected_intent is None or result["intent"] == expected_intent
        topic_ok = expected_topic is None or result["topic"] == expected_topic

        if intent_ok and topic_ok:
            correct += 1
        else:
            wrong += 1
            errors.append({
                "id": q["id"],
                "question": q["question"][:60],
                "expected_intent": expected_intent,
                "got_intent": result["intent"],
                "expected_topic": expected_topic,
                "got_topic": result["topic"],
            })

    accuracy = correct / len(EVAL_SET) * 100 if EVAL_SET else 0

    print(f"Results:")
    print(f"  ✅ Correct: {correct}/{len(EVAL_SET)} ({accuracy:.1f}%)")
    print(f"  ❌ Wrong:   {wrong}/{len(EVAL_SET)}")

    if errors:
        print(f"\nErrors ({len(errors)}):")
        for e in errors[:20]:
            print(f"  [{e['id']}] {e['question']}")
            print(f"    Expected: intent={e['expected_intent']}, topic={e['expected_topic']}")
            print(f"    Got:      intent={e['got_intent']}, topic={e['got_topic']}")

    # Category breakdown
    cats = Counter(q["category"] for q in EVAL_SET)
    cat_correct = Counter()
    for q in EVAL_SET:
        r = classify_intent(q["question"])
        ei = q.get("expected_intent")
        et = q.get("expected_topic")
        if (ei is None or r["intent"] == ei) and (et is None or r["topic"] == et):
            cat_correct[q["category"]] += 1

    print(f"\nPer-category accuracy:")
    for cat in sorted(cats.keys()):
        total = cats[cat]
        ok = cat_correct.get(cat, 0)
        pct = ok / total * 100 if total else 0
        bar = "█" * int(pct / 5) + "░" * (20 - int(pct / 5))
        print(f"  {cat:20s} {bar} {ok}/{total} ({pct:.0f}%)")

    return {"accuracy": accuracy, "correct": correct, "wrong": wrong, "total": len(EVAL_SET), "errors": errors}


if __name__ == "__main__":
    run_intent_evaluation()
