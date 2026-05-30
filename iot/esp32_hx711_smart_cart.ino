/*
  Smart Cart ESP32 + HX711 weight sensor sample.
  Calibrate SCALE_FACTOR for your load cell before live use.
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include "HX711.h"

const char* WIFI_SSID = "YOUR_WIFI";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";
const char* API_URL = "http://192.168.1.20:4000/api/iot/weight";

const int HX711_DOUT = 4;
const int HX711_SCK = 5;
const float SCALE_FACTOR = 2280.0;

HX711 scale;

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  scale.begin(HX711_DOUT, HX711_SCK);
  scale.set_scale(SCALE_FACTOR);
  scale.tare();
}

void loop() {
  if (!scale.is_ready()) {
    delay(1000);
    return;
  }

  float weightKg = max(0.0f, scale.get_units(10) / 1000.0f);
  String cartId = "demo-cart-id";

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(API_URL);
    http.addHeader("Content-Type", "application/json");
    String body = "{\"cartId\":\"" + cartId + "\",\"weightKg\":" + String(weightKg, 3) + ",\"deviceId\":\"esp32-scale-01\"}";
    int code = http.POST(body);
    Serial.printf("Weight %.3f kg, API %d\n", weightKg, code);
    http.end();
  }

  delay(1500);
}
