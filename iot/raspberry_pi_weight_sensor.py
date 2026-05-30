import time
import requests

API_URL = "http://localhost:4000/api/iot/weight"
CART_ID = "demo-cart-id"
DEVICE_ID = "raspi-scale-01"


def read_weight_kg() -> float:
    # Replace this with hx711py or gpiozero HX711 integration after calibration.
    return 0.532


while True:
    payload = {"cartId": CART_ID, "weightKg": read_weight_kg(), "deviceId": DEVICE_ID}
    response = requests.post(API_URL, json=payload, timeout=3)
    print(response.status_code, response.text)
    time.sleep(1.5)
