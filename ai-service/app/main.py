from collections import Counter
from datetime import datetime
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Smart Cart AI Service", version="1.0.0")

PRODUCTS = [
    {"id": "p1", "name": "Brown Bread", "category": "Bakery", "price": 45, "weightKg": 0.4, "score": 0.87},
    {"id": "p2", "name": "Milk (Amul 500ml)", "category": "Dairy", "price": 55, "weightKg": 0.53, "score": 0.93},
    {"id": "p3", "name": "Eggs (10-pack)", "category": "Dairy", "price": 65, "weightKg": 0.6, "score": 0.81},
    {"id": "p4", "name": "Basmati Rice (1kg)", "category": "Grains", "price": 150, "weightKg": 1.0, "score": 0.76},
    {"id": "p5", "name": "Refined Oil (1L)", "category": "Oils", "price": 95, "weightKg": 0.92, "score": 0.74},
    {"id": "p6", "name": "Butter (200g)", "category": "Dairy", "price": 120, "weightKg": 0.2, "score": 0.9},
    {"id": "p7", "name": "Tea (500g)", "category": "Beverages", "price": 85, "weightKg": 0.5, "score": 0.86},
    {"id": "p8", "name": "Honey (500ml)", "category": "Foods", "price": 180, "weightKg": 0.7, "score": 0.79},
]

PAIRINGS = {
    "Brown Bread": ["Butter (200g)", "Milk (Amul 500ml)"],
    "Milk (Amul 500ml)": ["Brown Bread", "Tea (500g)"],
    "Basmati Rice (1kg)": ["Refined Oil (1L)"],
    "Tea (500g)": ["Milk (Amul 500ml)", "Honey (500ml)"],
}


class CartItem(BaseModel):
    name: str
    quantity: int
    weightKg: float


class FraudRequest(BaseModel):
    cart_id: str
    expected_weight_kg: float
    actual_weight_kg: float
    scan_events: list[dict[str, Any]] = []
    payment_status: str = "PENDING"
    exit_attempted: bool = False


@app.get("/health")
def health() -> dict[str, str]:
    return {"ok": "true", "service": "smart-cart-ai", "time": datetime.utcnow().isoformat()}


@app.get("/recommendations/{user_id}")
def recommendations(user_id: str) -> list[dict[str, Any]]:
    ranked = sorted(PRODUCTS, key=lambda product: product["score"], reverse=True)
    return [
        {"product": product, "reason": "Popular with Smart Supermarket shoppers", "score": round(product["score"], 2)}
        for product in ranked[:4]
    ]


@app.post("/recommendations/cart")
def cart_recommendations(items: list[CartItem]) -> list[dict[str, Any]]:
    scanned = {item.name for item in items}
    candidates: list[str] = []
    for item in items:
        candidates.extend(PAIRINGS.get(item.name, []))
    counts = Counter(candidate for candidate in candidates if candidate not in scanned)
    if not counts:
        counts.update(["Butter (200g)", "Tea (500g)"])
    response = []
    for name, count in counts.most_common(4):
        product = next(product for product in PRODUCTS if product["name"] == name)
        response.append({"product": product, "reason": "Complements items in your cart", "score": min(0.99, 0.72 + count * 0.1)})
    return response


@app.get("/best-product-week")
def best_product_week() -> dict[str, Any]:
    product = next(product for product in PRODUCTS if product["name"] == "Brown Bread")
    return {"product": product, "units_sold": 1234, "growth_percent": 12}


@app.get("/category-suggestions/{category_id}")
def category_suggestions(category_id: str) -> list[dict[str, Any]]:
    category = category_id.lower()
    return [product for product in PRODUCTS if category in product["category"].lower() or category in product["name"].lower()][:6]


@app.post("/fraud/score")
def fraud_score(payload: FraudRequest) -> dict[str, Any]:
    expected = max(payload.expected_weight_kg, 0.001)
    variance = abs(payload.actual_weight_kg - expected) / expected * 100
    reasons: list[str] = []
    score = 0.05

    if variance > 2:
        score += min(0.7, variance / 100)
        reasons.append(f"Weight variance {variance:.2f}% exceeds 2% tolerance")
    if len(payload.scan_events) > 8:
        repeated = Counter(event.get("barcode") for event in payload.scan_events)
        if any(count >= 5 for count in repeated.values()):
            score += 0.15
            reasons.append("Repeated scan/remove behavior detected")
    if payload.exit_attempted and payload.payment_status != "PAID":
        score += 0.35
        reasons.append("Exit attempted without paid payment")

    score = min(score, 0.99)
    risk = "LOW" if score < 0.35 else "MEDIUM" if score < 0.65 else "HIGH"
    return {"cart_id": payload.cart_id, "fraud_score": round(score, 2), "risk": risk, "variance_percent": round(variance, 2), "reasons": reasons}
