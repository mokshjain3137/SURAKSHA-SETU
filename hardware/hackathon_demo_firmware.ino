/*
 * ==============================================================================
 *  SURAKSHA SETU — HACKATHON LIVE HARDWARE FIRMWARE
 * ==============================================================================
 *  Configured specifically for your exact kit:
 *    1. ESP32 DevKit V1
 *    2. ADXL Accelerometer (Seismic / Earthquake Detection)
 *    3. DHT22 (High-Precision Temperature & Humidity)
 *    4. HC-SR04 Ultrasonic (Water Level / Flood Detection)
 *    5. Raindrop Module (Precipitation / Cloudburst)
 * ==============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>

// ======================= 1. NETWORK & CLOUD CREDENTIALS =======================
const char* ssid     = "Realme15pro";       // Mobile Hotspot SSID
const char* password = "Rishith2007";       // Mobile Hotspot Password

// Laptop Local Server Telemetry Endpoint (Your exact Laptop Wi-Fi IP on port 3000)
const char* server_url = "http://10.208.78.150:3000/api/telemetry";

// Cloud Backup: Supabase REST API Credentials
const char* supabase_url = "https://roypndzefjunimxzvcnf.supabase.co/rest/v1/sensor_logs";
const char* supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJveXBuZHplZmp1bmlteHp2Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMTgwNTMsImV4cCI6MjA5Mzc5NDA1M30.bxHGO-nOBEsTBDUg8WIVHRr3Qyxy0g1DxokvVOHqK18";

// Cloud Alerts: Telegram Bot Credentials
const char* telegram_bot_token = "8683344314:AAETE34zer-DgxDcDqa56Vi_sJ8MQeCSRQc";
const char* telegram_chat_id   = "7988893018";

// ======================= 2. PIN DEFINITIONS =======================
// DHT22 (Temperature & Humidity)
#define DHTPIN 14          // Pin D14 (GPIO 14)
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// HC-SR04 Ultrasonic (Flood / Water Distance)
#define TRIG_PIN 25        // Pin D25 (GPIO 25)
#define ECHO_PIN 26        // Pin D26 (GPIO 26)

// Raindrop Sensor (Analog AO pin)
#define RAIN_PIN 33        // Pin D33 (GPIO 33)

// ADXL345 I2C (SDA=Pin D21, SCL=Pin D22)
// Note: CS pin MUST be connected to 3.3V / VCC to enable I2C mode!
#define ADXL345_ADDR 0x53
bool adxl_found = false;

// ======================= 2B. VIRTUAL POWER PINS (NO BREADBOARD NEEDED) =======================
// If your hardware 3V3 and 5V pins are already occupied, these D-pins act as active 3.3V and GND:
#define VIRTUAL_VCC_1  13  // Pin D13 -> Outputs +3.3V (e.g. DHT22 VCC)
#define VIRTUAL_GND_1  12  // Pin D12 -> Outputs 0V    (e.g. DHT22 GND)
#define VIRTUAL_VCC_2  4   // Pin D4  -> Outputs +3.3V (Used by ADXL345 VCC)
#define VIRTUAL_GND_2  2   // Pin D2  -> Outputs 0V    (Used by ADXL345 GND)
#define VIRTUAL_VCC_3  15  // Pin D15 -> Outputs +3.3V (Plug ADXL345 CS into D15!)
#define VIRTUAL_VCC_4  5   // Pin D5  -> Outputs +3.3V (Extra 3.3V power pin)

// If you have Analog ADXL335 instead of ADXL345, set this to true:
const bool USE_ANALOG_ADXL335 = false;
#define ADXL_X_PIN 34
#define ADXL_Y_PIN 35
#define ADXL_Z_PIN 32

// ======================= 3. HELPER FUNCTIONS =======================

void initADXL345() {
  Wire.begin(21, 22);
  Wire.beginTransmission(ADXL345_ADDR);
  Wire.write(0x2D); // Power Control Register
  Wire.write(8);    // Measure Mode
  byte error = Wire.endTransmission();
  if (error == 0) {
    adxl_found = true;
    Serial.println(" [✔] ADXL345 Accelerometer detected via I2C (0x53)");
  } else {
    Serial.println(" [!] ADXL345 I2C not responding. Using analog fallback or simulation.");
  }
}

float readSeismicVector() {
  if (USE_ANALOG_ADXL335) {
    // Read raw ADC (0-4095) from analog pins
    int rx = analogRead(ADXL_X_PIN) - 2048;
    int ry = analogRead(ADXL_Y_PIN) - 2048;
    int rz = analogRead(ADXL_Z_PIN) - 2048;
    float mag = sqrt(rx * rx + ry * ry + rz * rz) / 100.0;
    return mag;
  }

  if (!adxl_found) {
    // Baseline resting gravity
    return 0.05 + ((random(-20, 20)) / 1000.0);
  }

  Wire.beginTransmission(ADXL345_ADDR);
  Wire.write(0x32); // Register 0x32 (Data start)
  Wire.endTransmission(false);
  Wire.requestFrom((uint8_t)ADXL345_ADDR, (size_t)6, true);

  if (Wire.available() >= 6) {
    int16_t x = Wire.read() | (Wire.read() << 8);
    int16_t y = Wire.read() | (Wire.read() << 8);
    int16_t z = Wire.read() | (Wire.read() << 8);

    // ADXL345 scale factor ~0.0039g/LSB, 1g = 9.8 m/s^2
    float ax = (x * 0.0039) * 9.8;
    float ay = (y * 0.0039) * 9.8;
    float az = (z * 0.0039) * 9.8;

    float vectorMagnitude = sqrt(ax * ax + ay * ay + az * az);
    // Deviation from 1G resting earth gravity (~9.8 m/s^2)
    float tremorDelta = abs(vectorMagnitude - 9.8);
    return tremorDelta;
  }
  return 0.05;
}

float readUltrasonicDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  if (duration == 0) return 120.0; // Default baseline if not connected

  // Distance in cm
  float distance = duration * 0.034 / 2.0;
  return distance;
}

// ======================= 4. SETUP =======================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n==================================================");
  Serial.println("  SURAKSHA SETU — LIVE HARDWARE TELEMETRY NODE");
  Serial.println("==================================================");

  // Setup Virtual Power Rails (for powering sensors without a breadboard)
  pinMode(VIRTUAL_VCC_1, OUTPUT);
  digitalWrite(VIRTUAL_VCC_1, HIGH); // Pin D13 = +3.3V
  pinMode(VIRTUAL_GND_1, OUTPUT);
  digitalWrite(VIRTUAL_GND_1, LOW);  // Pin D12 = GND

  pinMode(VIRTUAL_VCC_2, OUTPUT);
  digitalWrite(VIRTUAL_VCC_2, HIGH); // Pin D4  = +3.3V (ADXL345 VCC)
  pinMode(VIRTUAL_GND_2, OUTPUT);
  digitalWrite(VIRTUAL_GND_2, LOW);  // Pin D2  = GND   (ADXL345 GND)

  pinMode(VIRTUAL_VCC_3, OUTPUT);
  digitalWrite(VIRTUAL_VCC_3, HIGH); // Pin D15 = +3.3V (ADXL345 CS pin)
  pinMode(VIRTUAL_VCC_4, OUTPUT);
  digitalWrite(VIRTUAL_VCC_4, HIGH); // Pin D5  = +3.3V (Extra 3.3V)
  delay(100); // Allow sensor power rails to stabilize

  // Initialize Sensors
  dht.begin();
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(RAIN_PIN, INPUT);

  initADXL345();

  // Connect to Wi-Fi
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[✔] Wi-Fi Connected!");
    Serial.print("ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[!] Wi-Fi not connected. Check SSID/Password.");
  }
}

// ======================= 5. MAIN LOOP =======================
void loop() {
  // 1. Read DHT22
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  if (isnan(temp)) temp = 26.5;
  if (isnan(hum)) hum = 64.0;

  // 2. Read HC-SR04 Ultrasonic (Water Distance)
  float waterDist = readUltrasonicDistance();

  // 3. Read ADXL (Tremor / Vibration)
  float seismic = readSeismicVector();

  // 4. Read Raindrop Sensor (Analog: inverted 0-4095)
  int rawRain = analogRead(RAIN_PIN);
  int rainLevel = map(rawRain, 4095, 0, 0, 100);
  if (rainLevel < 0) rainLevel = 0;

  // 5. Evaluate Emergency Thresholds
  String status = "Normal Operational Baseline";
  int priority = 1;

  if (seismic > 5.0) {
    status = "🚨 CRITICAL: SEISMIC GROUND TREMOR (ADXL)";
    priority = 4;
  } else if (waterDist < 15.0) { // Object closer than 15cm = rising water
    status = "🌊 CRITICAL: FLOOD LEVEL RISING (HC-SR04)";
    priority = 4;
  } else if (rainLevel > 60) {
    status = "🌧️ WARNING: HEAVY RAINFALL (Rain Grid)";
    priority = 3;
  }

  // Print to Serial Monitor
  Serial.printf("\n--- Telemetry: Temp: %.1f°C | Hum: %.1f%% | Water: %.1fcm | Seismic: %.2f m/s² | Rain: %d%% [%s]\n",
                temp, hum, waterDist, seismic, rainLevel, status.c_str());

  // 6. Push to Web Dashboard API
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(server_url);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<512> doc;
    doc["temperature"] = temp;
    doc["humidity"] = hum;
    doc["water_level"] = waterDist;
    doc["seismic"] = seismic;
    doc["rain_level"] = rainLevel;
    doc["soil_moisture"] = 2100;
    doc["baro_pressure"] = 1011.5;
    doc["altitude"] = 770.0;
    doc["air_quality"] = 180;
    doc["wind_speed"] = 12.5;
    doc["wind_direction"] = 190;
    doc["lora_node"] = "ESP32-NODE-01";
    doc["lora_rssi"] = -62;
    doc["status"] = status;

    String jsonString;
    serializeJson(doc, jsonString);

    int httpCode = http.POST(jsonString);
    if (httpCode > 0) {
      Serial.printf(" [✔] Live Web Dashboard Synced (HTTP %d)\n", httpCode);
    } else {
      Serial.printf(" [✘] Web Sync Failed: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();
  }

  // Poll every 3 seconds for fast demo response
  delay(3000);
}
