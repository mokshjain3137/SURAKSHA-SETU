# 📡 Suraksha Setu: Hybrid LoRa-Based Disaster Monitoring & Communication System

> **IEEE Region 10 Humanitarian Technology Activities (HTA) Makers DIY Project Competition Entry**
> **WINNERS PES HACKATHON**
> 
> Suraksha Setu is a low-cost, open-source, and fully off-grid disaster resilience ecosystem covering disaster monitoring, emergency communication, and tactical rescue dispatching.

---

## 🏗️ Unified System Architecture

```text
                           ☁️ Cloud Dashboard
                     (Next.js + Supabase + Maps)
                                    ▲
                                    │ Internet (When Available)
                                    │
                         ┌───────────────────────┐
                         │  Command & Control HQ │
                         └───────────────────────┘
                                    ▲
                                    │
                            LoRa Gateway Station
                                    ▲
 ══════════════════════════════════════════════════════════════

           LONG RANGE LoRa MESH NETWORK (5–10 km)

   Sensor Node ◄────► Relay Node ◄──────────────► Gateway
        ▲                  ▲                          ▲
        │                  │                          │
        │                  │                          │
   Flood Sensors      Landslide                  Gateway Node
   Fire Sensors         Sensors                  (HQ Station)

        ▲                                             ▲
        │                                             │
        └───────────── Bluetooth / Wi-Fi ─────────────┘
                       ▲              ▲
                       │              │
                Victim Phone     Volunteer Phone
```

---

## ⚡ The 3 Pillars of Suraksha Setu

Suraksha Setu addresses the entire disaster lifecycle through three operational modules:

### 1. 🌊 Disaster Monitoring & Early Warning (Before)
*   **Flood Alarm Nodes:** Deployed near rivers and dams. Combines ESP32, ultrasonic water depth sensors, rain gauges, and solar-charged batteries.
*   **Landslide Alert Nodes:** Deployed on vulnerable hillsides. Leverages **MPU6050 accelerometers** for ground shift vibration and soil moisture probes to detect liquid saturation.
*   **Edge Threat Engine:** Evaluates data on-node. Critical threats trigger instant, high-priority LoRa broadcasts.

### 2. 📡 Hybrid Offline Communication Mesh (During)
*   **BLE Discovery:** The mobile app uses Bluetooth Low Energy (BLE) to discover nearby victim devices and local LoRa nodes without cellular networks.
*   **Wi-Fi Direct Transfer:** High-bandwidth file transfer (e.g., medical forms, offline map imagery, coordinates) between smartphones and local ESP32 stations.
*   **LoRa Mesh Backhaul:** ESP32 nodes relay compressed emergency data (GPS, health status, battery levels) node-to-node across several kilometers to Command HQ.

### 💻 3. Tactical Command & Rescue Dashboard
*   **Edge Dashboard:** Can run in offline-mode on a Raspberry Pi local server or online on a Next.js + Supabase platform.
*   **Features:** Live map visualization of flood levels, landslide sensors, active rescue teams, and victim locations. Features priority-weighted rescue routing and bidirectional status updates.

---

## 📂 Repository Structure

*   [src/](file:///Users/bharathkumara/Desktop/SURAKSHA_SETU-main/src) — Web Command Dashboard (Next.js & Leaflet Maps)
*   [SurakshaSetu/](file:///Users/bharathkumara/Desktop/SURAKSHA_SETU-main/SurakshaSetu) — Flutter Offline Mobile Mesh Application
*   [hardware/](file:///Users/bharathkumara/Desktop/SURAKSHA_SETU-main/hardware) — ESP32 firmware (`espcode.c++`), circuit diagrams, and system layouts
*   [IEEE_SUBMISSION_GUIDE.md](file:///Users/bharathkumara/Desktop/SURAKSHA_SETU-main/IEEE_SUBMISSION_GUIDE.md) — Step-by-step IEEE Region 10 competition template & Bill of Materials
*   [TECHNOLOGY_INNOVATIONS.md](file:///Users/bharathkumara/Desktop/SURAKSHA_SETU-main/TECHNOLOGY_INNOVATIONS.md) — Implementation guides for LoRa mesh, deep sleep, and edge command servers

---

## 🏆 IEEE Competition Theme Alignment

| Challenge Requirement | Suraksha Setu Implementation | Status |
| :--- | :--- | :--- |
| **🌊 Flood Detection Alarms** | Ultrasonic depth monitoring + precipitation analysis + LoRa alert routing | **Implemented** |
| **⛰️ Landslide Monitoring Networks** | MPU6050 seismic acceleration + soil saturation telemetry | **Implemented** |
| **📡 Long-Range Emergency Mesh** | Hybrid BLE (discovery) + Wi-Fi Direct (local transfer) + LoRa Mesh (backhaul) | **Implemented** |

---

## Getting Started (Web Dashboard)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
