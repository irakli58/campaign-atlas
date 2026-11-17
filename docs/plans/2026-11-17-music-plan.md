# Music with real instruments: findings and plan (for the user's approval)

Answers `docs/requests/2026-11-17-music-overhaul.md`, section 15. Nothing large has been downloaded. Written 17 Nov 2026.

## What Atlas has now

- **Generated music** (engine/atlas-music.js): composed in the page and played by Web Audio oscillators and noise: every instrument is synthesised. This is why medieval and 1920s music sound synthetic: a lute is an oscillator with a plucked envelope, not a recorded lute.
- **Recorded music** (11 Nov): four music packs (Scott Buckley, Kevin MacLeod, CC BY) chosen by mood; the editor's Recorded music tab.
- **Sounds** (atlas-sound.js): real recordings in packs, scenes that loop, the narrator ducking them. One mixer exists.
- **The narrator** (atlas-narrator.js): Kokoro in the page; music and sounds are lowered while it speaks.

So premade music, the soundboard and ducking exist. What is missing is the generated music played on **recorded instruments**, and better composition for each genre.

## 1. The best free instrument libraries

| Library | Licence | Instruments | Format | Bundle? |
|---|---|---|---|---|
| [VSCO 2 Community Edition](https://versilian-studios.com/vsco-community/) | CC0 | Chamber orchestra: strings, woodwinds, brass, percussion, keys | SFZ / WAV | Yes |
| [VCSL, Versilian Community Sample Library](https://github.com/sgossner/VCSL) | CC0 | Dozens of orchestral, world and experimental instruments (the full list to be checked for lute, hurdy-gurdy, recorder, frame drums) | WAV / SFZ | Yes |
| [Salamander Grand Piano](https://sfzinstruments.github.io/pianos/salamander) | CC-BY 3.0 (credit Alexander Holm) | Yamaha C5 grand, 16 velocity layers | SFZ / WAV | Yes, with credit |
| [Virtual Playing Orchestra](https://sfzinstruments.github.io/orchestra/vpo) | Mixed: [Sampling Plus 1.0, CC BY-SA 3.0, CC0](https://os.zynthian.org/factory_sfz/Other/VPO3-perf/Documentation/license.htm) by part | Full orchestra | SFZ | Only its CC0 and CC-BY parts after checking; Sampling Plus and BY-SA parts left out |
| Karoryfer Samples | CC0 for some freebies (one [user's claim](https://www.kvraudio.com/forum/viewtopic.php?p=9179000); to be checked on Karoryfer's own pages) | Various, possibly upright bass and drums | SFZ | Only after checking |
| [GeneralUser GS](https://scancode-licensedb.aboutcode.org/generaluser-gs-2.0.LICENSE) | Custom, permissive, but the samples' origins cannot all be verified ([Debian rejected it](https://lists.debian.org/debian-legal/2023/03/msg00001.html)) | Full General MIDI set | SF2 | Not bundled; at most the game master's own download |
| FreePats | Per instrument (not verified here) | Various | SF2/SFZ | Only per instrument after checking |

The gap: CC0 or CC-BY samples of true medieval instruments (lute, hurdy-gurdy, shawm, crumhorn) are scarce. VCSL is checked first; where it lacks one, a close acoustic stand-in (classical guitar or harp for lute, recorder, fiddle) is used and said so, and a hurdy-gurdy may need its own recording or a careful hybrid (a recorded drone with a sampled melody).

## 2. The sampler

- **[SpessaSynth](https://github.com/spessasus/spessasynth_lib)** (Apache-2.0): a SoundFont (SF2/SF3) synthesiser in the browser, with velocity layers, envelopes, reverb and chorus. Its licence allows bundling.
- SFZ libraries (VSCO, VCSL, Salamander) would be converted to SF2/SF3 when the packs are made (in the workspace, with Polyphone or a script), so one engine plays everything. sfizz (SFZ natively) was looked at; its WebAssembly build and licence were not verified.
- Atlas's own scheduler stays: it composes and sends notes; the sampler plays them. The synthesisers stay for science fiction and are mixed in where wanted.

## 3. Medieval music

Two kinds, as the request asks: **historically informed** (modes: Dorian, Mixolydian, Lydian; drones; estampie and saltarello rhythms; small consorts of fiddle, recorder, lute, frame drum) and **cinematic fantasy** (strings, horns, harp, choir pads, larger dynamics). Scenes: tavern (lively consort, frame drum), court (slower, recorders and lute), village, bard (one instrument), forest, temple (drone and voice-like pads), dungeon (low drones, sparse percussion), battle, countryside, magic.

## 4. 1920s jazz and Call of Cthulhu

Jazz needs more than samples: swing (the off-beats delayed by about a third), syncopated melodies, walking bass, comping chords with extended voicings (sixths, ninths, diminished), brushes on snare and ride. Instruments: piano (Salamander), upright bass, clarinet, trumpet, trombone, saxophone, banjo, brush kit, vibraphone (from VSCO/VCSL where present; the rest to be found). Horror and investigation: solo piano with sparse dissonance resolved late, string harmonics and tremolo, low brass swells; tension built by register and density, not random notes.

## 5. Science fiction

The present synthesisers stay as the science fiction instruments, unchanged, with acoustic instruments added only where a scene asks.

## 6. Composition

Atlas's composer is reworked per genre: phrases of 4 and 8 bars with question and answer, motifs repeated and varied, chord progressions per genre (modal for medieval, ii–V–I and turnarounds for jazz, chromatic mediants for horror), dynamics over a phrase, tempo breathing, endings that resolve, transitions on bar lines. Better samples alone will not fix repetitive music; this part is as important as the instruments.

## 7. Size and hardware

Packs as optional downloads (the project's releases, like the sound packs), estimates to be measured: Medieval & Folk 60–150 MB, 1920s Jazz 80–200 MB (the piano alone 50–100 MB compressed to SF3), Orchestral & Horror 150–300 MB. Playback in the page: any computer that plays the present music; memory 100–400 MB for one loaded pack.

## 8. Licences

CC0 freely; CC-BY with credits in each pack and in Atlas's credits screen; nothing with Sampling Plus or ShareAlike unless the user agrees to its terms; nothing whose origins are unclear (GeneralUser GS) bundled.

## 9. The phases

1. A listening test: one tavern piece, one speakeasy piece and one horror piece, played by the present synths and by sampled instruments, for the user's ears (about 100–200 MB of samples downloaded into the workspace only, with the user's yes).
2. The sampler in the page (SpessaSynth), the first packs (medieval, 1920s), the composer's genre rules.
3. Orchestral and horror; adaptive intensity (layers entering and leaving on bar lines, the game master's control).
4. The rest of the scenes; the packs published.

## 10. Also recommended

- Music volume, ambience, sound effects and narration each with its own slider (some exist: to check all four).
- Adaptive music driven by the game master only (a calm–tense–fight slider), never by itself.
- Local AI music models were looked at only in outline: they need a strong GPU and their output is hard to loop and control; not recommended now.

## What needs your yes

- The listening test's download (phase 1), its size shown first.
- Leaving out Sampling Plus and ShareAlike material, or accepting their terms.
- SpessaSynth as the sampler.

## Done since (17 Nov; the user: "make executive decisions")

- **The jazz age**, a new style ("Jazz age, the 1920s and 30s", atlas-music.js FLAVOURS.jazzage): clarinet and cornet on the tune, the upright piano comping, the double bass walking, vibraphone for the bell, chords in sevenths, mixolydian and dorian. New grooves: **swing** (the ride cymbal's ding, ding-a ding, hi-hat foot on two and four, brushes, a feathered bass drum, the walking bass on every beat, Charleston comping, the off-beats about a third late), **hotswing** (faster, a snare instead of brushes), **ballad** (slow, brushes). New sounds: the ride cymbal (R, r) and brushes (U). The walking bass (`w`): the chord's root, third, fifth and seventh, a half step leading into the next bar every second bar.
- **The dark mystery's 1920s**: in the default Call of Cthulhu style ("arkham"), a place named as a speakeasy, jazz club, nightclub, dance hall, cabaret, bar or saloon, or a tavern, now plays the jazz age; investigation and dread stay orchestral.
- Rendered and measured offline (atlas-music.js `render`/`measure`): the speakeasy, a jazz ballad and the older tavern for comparison, no silence and no clipping. Still synthesised: recorded instruments need the samples, which this cloud session cannot download (versilian-studios.com, github.com refused); they come from the user's computer.
- **Composition in phrases (17 Nov)**, every style but the orchestral dread (which keeps its four-bar breathing): eight bars make a question and its answer. The place's tune is stated; sequenced a step higher; its first half twice, rising; a half close on the scale's fifth (the harmony goes there too); stated again; turned back on itself; quicker and higher, the phrase's height; home on the keynote, held, over the keynote's chord. Loudness rises to the seventh bar and falls back. The fifth is found in each scale (a pentatonic one too). Rendered and measured offline in six styles (medieval tavern, fantasy forest, speakeasy, a Japanese temple, the dark mystery's dread, an Arabian market): no silence, no clipping.
