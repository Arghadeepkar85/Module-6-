#!/usr/bin/env python3
"""
Android Audio Pipeline CLI Simulator
Simulates the message flow from Media Service to Audio HAL when user input is triggered.
"""

import sys
import time
from datetime import datetime

# ANSI Color Codes
CYAN = "\033[96m"
BLUE = "\033[94m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
MAGENTA = "\033[95m"
BOLD = "\033[1m"
RESET = "\033[0m"

def get_timestamp():
    now = datetime.now()
    return f"09-28 {now.strftime('%H:%M:%S')}.{now.microsecond // 1000:03d}"

def log(pid, tid, level, tag, tag_color, msg, delay=0.15):
    ts = get_timestamp()
    print(f"{ts}  {pid:>4}  {tid:>4} {tag_color}{level} {tag:<18}{RESET}: {msg}")
    time.sleep(delay)

def print_header(title):
    print(f"\n{BOLD}{MAGENTA}================================================================================{RESET}")
    print(f"{BOLD}{MAGENTA}  {title}{RESET}")
    print(f"{BOLD}{MAGENTA}================================================================================{RESET}")

def simulate_playback_start():
    print_header("STAGE 1: User Touch Input & Framework Event Dispatch")
    log("1850", "2104", "D", "InputDispatcher", BLUE, "Delivering touch to (com.example.musicplayer): action=ACTION_UP, x=540.0, y=1420.0")
    log("4210", "4210", "I", "MediaSession", BLUE, "dispatchMediaButtonEvent: KeyEvent { action=ACTION_DOWN, keyCode=KEYCODE_MEDIA_PLAY }")
    log("4210", "4210", "D", "MediaSessionCompat", BLUE, "Handling Play request from UI controller")

    print_header("STAGE 2: Audio Focus Request (system_server)")
    log("1850", "2450", "I", "AudioManager", CYAN, "requestAudioFocus() from uid/pid 10184/4210 req=1 flags=0x0")
    log("1850", "2450", "D", "AudioService", CYAN, "requestAudioFocus: granted focus to android.media.AudioManager@48ac212")

    print_header("STAGE 3: AudioTrack & Policy Evaluation (audioserver)")
    log("4210", "4280", "V", "AudioTrack", GREEN, "AudioTrack::set(): streamType -1, sampleRate 48000, format 0x1, channels 0x3, flags 0x4")
    log("4210", "4280", "D", "AudioSystem", GREEN, "getOutputForAttr() usage=1 (USAGE_MEDIA) content=2 (CONTENT_TYPE_MUSIC)")
    log(" 910", "1142", "I", "AudioPolicyManager", GREEN, "getOutputForAttr() attributes={ content: MUSIC, usage: MEDIA }")
    log(" 910", "1142", "D", "AudioPolicyManager", GREEN, "getOutputForAttr() selected profile: AUDIO_OUTPUT_FLAG_PRIMARY, out_handle: 13, device: SPEAKER")
    log(" 910", "1142", "I", "AudioFlinger", GREEN, "createTrack() sessionId 45, sampleRate 48000, flags 0x4")
    log(" 910", "1142", "D", "AudioFlinger", GREEN, "PlaybackThread::createTrack_l() allocated Track 125 out of MemoryDealer ashmem buffer (32KB)")
    log("4210", "4280", "D", "AudioTrack", GREEN, "start() track 125 [session 45]")
    log(" 910", "1142", "I", "AudioPolicyManager", GREEN, "startOutput() output 13, stream 3, activeCount=1")

    print_header("STAGE 4: Audio HAL Stream Configuration (AIDL / HIDL)")
    log(" 910", "1142", "I", "AudioFlinger", YELLOW, "openOutputStream() handle 13, device 0x2 (SPEAKER), flags 0x4")
    log(" 840", "1012", "I", "audio.primary.dev", YELLOW, "adev_open_output_stream: rate 48000, fmt 0x1, channels 0x3, flags 0x4")
    log(" 840", "1012", "D", "audio_hw_primary", YELLOW, "apply_audio_route: applying card 0, path 'speaker-playback'")

    print_header("STAGE 5: Kernel Subsystem & TinyALSA Hardware I/O")
    log(" 840", "1012", "I", "tinyalsa", RED, "pcm_open: card=0 device=0 flags=0x10000002 (PCM_OUT | PCM_MONOTONIC)")
    log(" 840", "1012", "D", "tinyalsa", RED, "pcm_open: pcm_param config: channels=2, rate=48000, period_size=960, period_count=4")
    log(" 910", "1142", "I", "AudioFlinger", GREEN, "PlaybackThread 13 (MixerThread) starting threadLoop")

    print_header("STAGE 6: Real-time Audio Streaming (Fast Message Queue - FMQ)")
    for i in range(3):
        log(" 910", "1290", "V", "AudioFlinger", GREEN, f"[Cycle {i+1}] PlaybackThread::threadLoop() mixing 1 active tracks", delay=0.1)
        log(" 910", "1290", "D", "AudioFlinger", GREEN, f"[Cycle {i+1}] MixerThread 13 writing 3840 bytes to HAL via FMQ", delay=0.1)
        log(" 840", "1015", "D", "tinyalsa", RED, f"[Cycle {i+1}] pcm_write: wrote 960 frames (3840 bytes) to /dev/snd/pcmC0D0p", delay=0.2)

    print(f"\n{BOLD}{GREEN}✔ Playback simulation successfully completed!{RESET}\n")

if __name__ == "__main__":
    print(f"\n{BOLD}{CYAN}Android Audio Message Flow Simulator (Media Service -> Audio HAL){RESET}")
    print(f"{CYAN}Starting end-to-end user input propagation trace...{RESET}\n")
    time.sleep(0.5)
    simulate_playback_start()
