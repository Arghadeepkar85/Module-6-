# Assignment Submission: Android Audio Message Flow Simulation
**Topic:** Message Flow Between Media Service and Audio HAL (User Input Propagation)  
**Author / Student:** Arghadeep Kar
**Course:** Android System Architecture / Operating Systems  

---

## 📁 Submission Deliverables Overview

This folder contains a complete, multi-format submission package demonstrating how user input propagates through the Android audio stack down to the hardware audio subsystem:

| File | Purpose | How to Open / Run |
| :--- | :--- | :--- |
| **`REPORT.md`** | **Comprehensive Technical Report** with system architecture diagrams, sequence diagrams, and in-depth component breakdowns. | Open in any Markdown viewer (VS Code, GitHub) or export to PDF. |
| **`interactive_simulator.html`** | **Interactive Web Simulator** allowing interactive triggering of Play, Volume, and Routing events with live animated layers and a scrolling Android logcat console. | Double-click to open in any web browser (Chrome, Edge, Firefox). |
| **`android_audio_simulation.log`** | **Raw Android Logcat Output** formatted according to standard `adb logcat -v time` conventions. | Open in any text editor, log viewer, or IDE. |
| **`simulate_audio_flow.js`** | **Terminal CLI Simulator** that outputs the synchronized, colorized message trace with realistic execution delays. | Run via terminal: `node simulate_audio_flow.js` |
| **`simulate_audio_flow.py`** | Python equivalent of the CLI simulator. | Run via terminal: `python simulate_audio_flow.py` |

---

## 🚀 Quick Start for Evaluation

### 1. View the Interactive Simulation in Browser
Simply open **`interactive_simulator.html`** in your browser:
* Click **`▶ User Tap: Play Media`** to trace the 5-layer propagation.
* Click **`🔊 Volume Up (+)`** to observe hardware key event handling via `InputDispatcher` &rarr; `AudioService` &rarr; HAL volume sliders.
* Click **`🎧 Route: Wired Headset`** to observe dynamic stream rerouting in `AudioPolicyManager`.

### 2. Run the CLI Simulation in Terminal
```bash
node simulate_audio_flow.js
```

---

## 🏗️ Core Architectural Concepts Demonstrated

1. **User Input Propagation:**
   * Screen touch &rarr; `InputReader` &rarr; `InputDispatcher` &rarr; App UI &rarr; `MediaController.play()`.
2. **Audio Focus & Policy:**
   * `system_server` (`AudioService`) validates focus (`AUDIOFOCUS_GAIN`).
   * `audioserver` (`AudioPolicyManager`) evaluates output flags (`AUDIO_OUTPUT_FLAG_PRIMARY`) and selects physical routing.
3. **Control Plane vs. Data Plane Split:**
   * **Control Plane (Binder IPC):** Low-frequency state updates, volume changes, and routing.
   * **Data Plane (Ashmem & FMQ):** High-frequency, deterministic audio frame streaming using anonymous shared memory and Fast Message Queues to prevent buffer underruns.
4. **Hardware Abstraction Layer (HAL) & ALSA:**
   * Vendor HAL (`audio.primary.so`) translates AIDL `IStreamOut.write()` into `tinyalsa` `pcm_write()` ioctls to Linux kernel ALSA nodes (`/dev/snd/pcmC*D*p`).
