# Local AI: audit, findings and plan (phase 1 built; the rest for the user's approval)

Answers `docs/requests/2026-11-17-local-ai.md` (the same as 2026-11-11-local-ai.md). Written 17 Nov 2026. The user: "we dont have fable 5.2 anymore so do it like this".

## 1. The audit: every feature and its AI

How Atlas asks today: a campaign page asks through one function, `askRaw` (engine/atlas-table-gm.js), which goes to the Atlas app's server (`/c/<campaign>/ask` → lib/ask.js → the game master's own Claude Code, `claude -p`); a whole campaign is made by Claude Code or Codex working in the workspace with the skill's handbook (lib/run-claude.js, lib/run-codex.js).

| Feature | How it works now | Local? |
|---|---|---|
| World maps, geology, climate, coasts, oceans, plates | Procedural (scripts/world-*.js) | Already local: no AI |
| Cities, buildings, interiors, caves, ships | Procedural (atlas-city.js, atlas-locations.js, ship.js, atlas-cave.js) | Already local |
| A building's inside from a description | Read without AI (atlas-quickplace.js) | Already local |
| Planets, star systems, galaxy | Physics and procedure (atlas-planet.js, atlas-galaxy*.js); one AI suggestion in the galaxy | Local; the suggestion can use local AI |
| Music | Composed and synthesised in the page | Already local |
| Narration | Kokoro in the page (WebGPU or WASM); Piper; the browser's voices | Already local |
| Portraits | Drawn from the description (atlas-portrait.js) | Already local |
| Players' parchment maps | Procedural | Already local |
| Session transcription | The browser's speech recognition | **Not private in Chrome** (sends sound to Google); local Whisper is a later phase |
| Ask the campaign, Previously on…, the copilot (Talk, Stuck?) | askRaw → Claude | **Local now (phase 1)**, with Local mode |
| Clue suggestions, the consistency check, consequences (deeds), events' proposals, handouts' help, people's help, knowledge (read a document into entries), Ask for a change (cities, places) | askRaw → Claude | Local now through the same route; quality varies by model (phase 2 makes them sturdier) |
| Reading a floor-plan picture | Claude Code reads the image | Not local: needs a vision model (later); in Local mode it says so and sends nothing |
| Making a whole campaign from a story (the councils, the maps, the files) | Claude Code / Codex, agentic, many files | **Needs significant change** (phase 3): small local models cannot yet run Atlas's whole handbook reliably |
| The writer councils | Part of making a campaign (Claude Code) | With phase 3 |
| Campaign memory and knowledge | Passages of the campaign looked up by words (the CORPUS in atlas-table-gm.js) and given in each question | Already local (no AI to look up); the same passages go to the local model |

## 2. What was built now (phase 1)

- **lib/hardware.js**: the operating system, processor and threads, memory, free disk, and each GPU with its memory where the system's own tool tells it (NVIDIA: nvidia-smi; AMD on Linux: rocm-smi; macOS: system_profiler, Apple silicon's shared memory; Windows: the names, its memory said to be unknown because Windows caps it at 4 GB; Linux otherwise: the names from lspci). Nothing is guessed: what cannot be read is said so, and the game master can enter it.
- **lib/ai-local.js**: a catalogue of 14 models (Ollama names, download size, memory, licence, strengths), the recommendations (best quality, balanced, fastest, low memory, each with why) from the memory the models can use (a GPU's own; two thirds of Apple silicon's; else the processor, slowly; mixture-of-experts models marked faster), Ollama's status, Download (a model pulled only when pressed, its size asked first), Measure (tokens a second, load time, time to begin: Ollama's own counts; kept and shown), and answering a question.
- **The app's Connections page**: "Local AI on this computer": Check this computer, what was found, the figures to correct, Ollama's status or how to install it (ollama.com; never installed by Atlas), the four picks with Download / Use this / Measure, Cloud or Local, and "ask Claude when the local model cannot answer" (off by default).
- **server.js**: in Local mode a campaign page's questions are answered by the chosen model on this computer and nothing is sent out (to Claude only if the game master turned the fallback on); reading a picture refuses in Local mode instead of sending it.
- Tested: detection here (no GPU: an honest "none found"); the card in the running app; with a stand-in answering as Ollama does: the model offered, chosen, measured, Local mode kept, the answer returned with the model's hidden thinking removed. **Not tested with a real model** (no download was made: the user's yes to a download first).

## 3. Findings: engines and models

- **Ollama** (MIT) is the engine for the desktop app: one installer for Windows, macOS and Linux; CUDA, ROCm, Metal and the CPU through llama.cpp; models kept for offline use; JSON-schema structured outputs ([docs](https://docs.ollama.com/capabilities/structured-outputs)); an OpenAI-compatible API, so **LM Studio** and **llama.cpp's server** can be offered as "another local server" with the same code later.
- **WebLLM** (in the browser, WebGPU) works for small models only (a 1B model needs about 0.9 GB of GPU memory; Chrome and Edge 113+): a later option for campaign pages opened outside the app ([WebLLM](https://blog.mlc.ai/2024/06/13/webllm-a-high-performance-in-browser-llm-inference-engine)).
- **Models** (the catalogue): Qwen3 4B/8B/14B/30B-A3B/32B (Apache 2.0), Gemma 3 4B/12B/27B (Gemma Terms of Use), Mistral Nemo 12B and Mistral Small 3.2 24B (Apache 2.0), gpt-oss 20B/120B (Apache 2.0), Llama 3.2 3B and 3.3 70B (Llama Community Licences). Guides of 2026 also name newer releases (Qwen 3.6, Gemma 4) that could not be confirmed here ([one such guide](https://llmhardware.io/guides/best-llm-for-writing-locally)); the catalogue is one list in lib/ai-local.js, to be brought up to date when each is checked on ollama.com. Atlas never redistributes a model: the game master pulls it from Ollama's library under the model's own licence, which the card shows.
- Honest quality: a 4–8B model is good for NPC lines, short descriptions and structured data; mysteries and long campaign writing want 14–32B; nothing local matches Claude on whole-campaign writing yet. The card says what each is good for.

## 4. The phases from here (for the user's approval)

2. **Sturdier local answers**: structured outputs (JSON schemas) for the features that want JSON (clues, entries, consequences), so a small model's answer is always usable; a fast mode for live sessions and a careful mode (plan, then write, then check against the campaign) for preparation; Hybrid: Local or Cloud chosen per feature (the copilot local, the councils in the cloud, and so on); the copilot's passages sized to the model's context.
3. **Making campaigns locally**: a staged maker for local models (the story council's steps one by one, each small and checked: the cast, the places, the clues, a solvability check for mysteries, the handouts), writing the same files Claude Code writes, so the same pages open; the councils as one shared model with each writer's prompt (no several models loaded at once). Needs the user's approval: it is a second way of making a campaign beside Claude Code.
4. **Knowledge for large campaigns**: local embeddings (a small embedding model through Ollama) to find the right passages, keeping the referee's secrets out of anything shown to players.
5. **Local images and audio** (optional): Whisper for transcription (private), local image models for portraits and handouts only on strong GPUs, said plainly.
6. **Quality comparison**: a fixed test set (fantasy campaign, Call of Cthulhu mystery, sci-fi campaign, NPC dialogue, politics, continuity, copilot improvisation, structured data) run through the cloud and each local model, scored by checks and by the user's reading; the recommendations then use the results.

## What needs the user's yes

- A real model download for testing (Qwen3 4B, 2.6 GB, the smallest good one), to test with a real model rather than the stand-in.
- Phases 2–6, and above all phase 3 (a second campaign maker).

## Done since (17 Nov, the user: "make executive decisions")

- **Phase 2, built**: Hybrid (Local or Claude chosen for each kind of work the pages ask for: answering, suggesting, reading, checking, writing; the page now sends the kind with each question); **careful** (on by default for writing and checking when local: a draft, then the model reads it against the question and the campaign's facts and mends it; answers at the table stay quick); **JSON kept valid** (a question asking for JSON gets Ollama's JSON format). In Hybrid, reading a picture goes to Claude (the cloud part); in Local it refuses. Tested with the stand-in.
- **Not done here**: a test with a real model. This cloud session's network refuses ollama.com, registry.ollama.ai, github.com and huggingface.co, so no model can come here; the test belongs on the user's computer (the card's Download, then Use this, then a question on a campaign page).

- **Phase 3, the local campaign maker, begun**: Atlas already had "What Atlas knows → Read it into entries" (the story read into people, places, what people know or hide, secrets, mysteries, plot points, made only when ticked), which in Local mode already asks the local model. Made fit for a small model: a long story is read in parts of about 6,000 letters (the page asks the app where reading is answered: `/c/<campaign>/aiwhere`, `ATLAS_APP.aiWhere`), each part's findings merged by name (a person met in two parts is one, with what each part said); a part that fails does not lose the rest; the box says which model read it. Claude still reads it whole. Tested with a stand-in: four parts, merged rightly. Next for phase 3: clues and handouts from the story, then a "make the campaign" button that runs the steps in order (read, then places' insides from their descriptions, then the clue trail checked for reachability).
- Phase 3, next step done: a place read from the story is made with its inside laid out and furnished by the description reader (atlas-quickplace.js; no AI for this step): the stand-in's "The Asylum" became a hospital with a waiting room, surgery, wards, an operating room and a laboratory on two floors. Left for phase 3: clues and handouts read from the story, and one "Make the campaign" button running the steps in order with the clue trail checked.
