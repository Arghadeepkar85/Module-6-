#!/usr/bin/env node
/**
 * Android Audio Pipeline CLI Simulator
 * Simulates message flow from Media Service to Audio HAL when user input occurs.
 */

const CYAN = "\x1b[96m";
const BLUE = "\x1b[94m";
const GREEN = "\x1b[92m";
const YELLOW = "\x1b[93m";
const RED = "\x1b[91m";
const MAGENTA = "\x1b[95m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function getTimestamp() {
  const now = new Date();
  const time = now.toTimeString().split(" ")[0];
  const ms = String(now.getMilliseconds()).padStart(3, "0");
  return `09-28 ${time}.${ms}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function log(pid, tid, level, tag, color, msg, delay = 120) {
  const ts = getTimestamp();
  const formattedPid = String(pid).padStart(4, " ");
  const formattedTid = String(tid).padStart(4, " ");
  const formattedTag = tag.padEnd(18, " ");
  console.log(`${ts}  ${formattedPid}  ${formattedTid} ${color}${level} ${formattedTag}${RESET}: ${msg}`);
  await sleep(delay);
}

function printHeader(title) {
  console.log(`\n${BOLD}${MAGENTA}================================================================================${RESET}`);
  console.log(`${BOLD}${MAGENTA}  ${title}${RESET}`);
  console.log(`${BOLD}${MAGENTA}================================================================================${RESET}`);
}

async function runSimulation() {
  console.log(`\n${BOLD}${CYAN}Android Audio Message Flow Simulator (Media Service -> Audio HAL)${RESET}`);
  console.log(`${CYAN}Starting end-to-end user input propagation trace...${RESET}\n`);
  await sleep(400);

  printHeader("STAGE 1: User Touch Input & Framework Event Dispatch");
  await log("1850", "2104", "D", "InputDispatcher", BLUE, "Delivering touch to (com.example.musicplayer): action=ACTION_UP, x=540.0, y=1420.0");
  await log("4210", "4210", "I", "MediaSession", BLUE, "dispatchMediaButtonEvent: KeyEvent { action=ACTION_DOWN, keyCode=KEYCODE_MEDIA_PLAY }");
  await log("4210", "4210", "D", "MediaSessionCompat", BLUE, "Handling Play request from UI controller");

  printHeader("STAGE 2: Audio Focus Request (system_server)");
  await log("1850", "2450", "I", "AudioManager", CYAN, "requestAudioFocus() from uid/pid 10184/4210 req=1 flags=0x0");
  await log("1850", "2450", "D", "AudioService", CYAN, "requestAudioFocus: granted focus to android.media.AudioManager@48ac212");

  printHeader("STAGE 3: AudioTrack & Policy Evaluation (audioserver)");
  await log("4210", "4280", "V", "AudioTrack", GREEN, "AudioTrack::set(): streamType -1, sampleRate 48000, format 0x1, channels 0x3, flags 0x4");
  await log("4210", "4280", "D", "AudioSystem", GREEN, "getOutputForAttr() usage=1 (USAGE_MEDIA) content=2 (CONTENT_TYPE_MUSIC)");
  await log(" 910", "1142", "I", "AudioPolicyManager", GREEN, "getOutputForAttr() attributes={ content: MUSIC, usage: MEDIA }");
  await log(" 910", "1142", "D", "AudioPolicyManager", GREEN, "getOutputForAttr() selected profile: AUDIO_OUTPUT_FLAG_PRIMARY, out_handle: 13, device: SPEAKER");
  await log(" 910", "1142", "I", "AudioFlinger", GREEN, "createTrack() sessionId 45, sampleRate 48000, flags 0x4");
  await log(" 910", "1142", "D", "AudioFlinger", GREEN, "PlaybackThread::createTrack_l() allocated Track 125 out of MemoryDealer ashmem (32KB)");
  await log("4210", "4280", "D", "AudioTrack", GREEN, "start() track 125 [session 45]");
  await log(" 910", "1142", "I", "AudioPolicyManager", GREEN, "startOutput() output 13, stream 3, activeCount=1");

  printHeader("STAGE 4: Audio HAL Stream Configuration (AIDL / HIDL)");
  await log(" 910", "1142", "I", "AudioFlinger", YELLOW, "openOutputStream() handle 13, device 0x2 (SPEAKER), flags 0x4");
  await log(" 840", "1012", "I", "audio.primary.dev", YELLOW, "adev_open_output_stream: rate 48000, fmt 0x1, channels 0x3, flags 0x4");
  await log(" 840", "1012", "D", "audio_hw_primary", YELLOW, "apply_audio_route: applying card 0, path 'speaker-playback'");

  printHeader("STAGE 5: Kernel Subsystem & TinyALSA Hardware I/O");
  await log(" 840", "1012", "I", "tinyalsa", RED, "pcm_open: card=0 device=0 flags=0x10000002 (PCM_OUT | PCM_MONOTONIC)");
  await log(" 840", "1012", "D", "tinyalsa", RED, "pcm_open: pcm_param config: channels=2, rate=48000, period_size=960, period_count=4");
  await log(" 910", "1142", "I", "AudioFlinger", GREEN, "PlaybackThread 13 (MixerThread) starting threadLoop");

  printHeader("STAGE 6: Real-time Audio Streaming (Fast Message Queue - FMQ)");
  for (let i = 1; i <= 3; i++) {
    await log(" 910", "1290", "V", "AudioFlinger", GREEN, `[Cycle ${i}] PlaybackThread::threadLoop() mixing 1 active tracks`, 80);
    await log(" 910", "1290", "D", "AudioFlinger", GREEN, `[Cycle ${i}] MixerThread 13 writing 3840 bytes to HAL via FMQ`, 80);
    await log(" 840", "1015", "D", "tinyalsa", RED, `[Cycle ${i}] pcm_write: wrote 960 frames (3840 bytes) to /dev/snd/pcmC0D0p`, 150);
  }

  console.log(`\n${BOLD}${GREEN}✔ Playback simulation successfully completed!${RESET}\n`);
}

runSimulation();
