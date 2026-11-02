# Session recording and the table's memory: the design (3 Nov 2026)

The request: docs/requests/2026-11-03-session-memory.md. The user added that the recorder will usually be a separate
phone, or a laptop (possibly a Mac). This is the architecture proposed and the prototype built to show it, before any
larger change. Prototype: engine/atlas-sessions.js (the tab "Recorded sessions"), app/lib/recorder-lan.js and
app/ui/recorder.html (the phone's recorder link), app/lib/selfsigned.js (its certificate), hooks in atlas-copilot.js,
atlas-history.js, atlas-deeds.js. Tests: the workspace's dev/session-test.js and dev/recorder-test.js.

## The whole, in one line

Recorder (a phone on the app's recorder link, this page on a laptop, or any recorder app) → the sound in ten-second
pieces, kept until safe → the words (live, from a transcript file, later from Whisper on this computer) → Claude reads
them a part at a time and proposes what to remember → the game master keeps, changes or rejects each note → the
campaign's memory → the copilot, the council's world events, the consequences, the world's history, the consistency
check and the investigation draw on the part of it that bears on each question.

## What phones can and cannot do

- **The microphone only on https.** Phone browsers give a page the microphone only over https (or on the device
  itself). The players' link is plain http, so the recorder has its own link over https, with a certificate the app
  makes for itself (no download, nothing leaves the computer). The phone warns once that it does not know who signed
  it; the game master chooses to go on.
- **A locked screen stops the microphone.** On an iPhone, Safari loses the microphone when the page goes to the
  background or the screen locks (WebKit bugs 204681, 226620); on Android, Chrome has been reported to cut capture about a
  minute after the screen goes off (Chromium bug 513633). No browser page can promise to record with the screen locked.
  So the recorder page keeps the screen awake (the Wake Lock API: Chrome, and Safari on iOS 18.4 and later), takes the
  microphone up again as soon as the page is seen, and loses only the locked minutes; it says so on screen.
- **The reliable way for a whole evening with the screen off is the phone's own recorder app** (Voice Memos on an
  iPhone, Google Recorder, Samsung Voice Recorder), then sending the file to the computer through the same link
  after the session. Built. Only a native app of Atlas's own could record in the background itself; not proposed unless
  this proves not enough.
- **A laptop or a Mac** records reliably with its lid open and plugged in: on the campaign's own page if it runs the
  Atlas app (the page is on the computer itself, so the microphone is allowed), or through the recorder link like a
  phone.

## Keeping the sound

- Opus at 32 kbit/s, about 14 MB an hour: a 4-hour session about 58 MB, 8 hours about 115 MB.
- Recorded in pieces of ten seconds. On the phone each piece is kept in its own storage until the computer has it,
  then sent; a dropped Wi-Fi, a reload or a crash loses nothing already recorded. A recording interrupted is offered
  back when the page opens again ("Go on recording it" or "Finish it"). Each run of the microphone is a part with its
  start time, so times stay true across pauses and interruptions.
- On the computer: the campaign's folder, recordings/<id>/ (never shared; the app's repository ignores its
  workspace). On a page without the app: the browser's own storage on that device.
- How long to keep the sound is the game master's choice (until deleted, 30 days, 7 days, or only until the words are
  added); the words and the memory stay.

## The words: the ways, and what they cost

| Way | Cost | Where it is heard | Who spoke | State |
|---|---|---|---|---|
| Live, the browser's speech service | free | Google's servers in Chrome (on the device in newer Chrome on computers, when offered); Apple's in Safari | not told apart | built |
| A transcript file from any tool | whatever the tool costs | wherever it was made | as the file says | built: text, SRT, VTT, JSON of Whisper, WhisperX, OpenAI, Deepgram, AssemblyAI |
| Whisper on the computer that runs Atlas | free | this computer only | needs a second model (pyannote, with a free Hugging Face account) or naming by hand | proposed: needs the user's yes to download |
| A service, with the user's own key (the hidden extra) | about $0.60 to $1.45 for 4 hours | the service's servers | yes | proposed, optional |

Service prices from third-party comparisons of mid-2026 (to check on each vendor's page): OpenAI
gpt-4o-transcribe-diarize about $0.006 a minute with speaker labels; Deepgram Nova-3 about $0.0043 a minute with
diarization; AssemblyAI about $0.0025 to $0.0035 a minute, diarization included.

Recommended: Whisper on the computer that runs Atlas as the default (free, private, many languages; Georgian is among
Whisper's languages, though less accurate than English). The download needs the user's yes first (for example the
whisper.cpp program and its large-v3-turbo model, about 550 MB to 1.6 GB depending on the version). Its speed on this
computer has to be measured; on the graphics card it should be several times faster than real time. The live words
stay as the instant way, and a service as the optional one.

## The memory

- **A note** has a kind (what the party did, a decision, a conversation, a promise or agreement, a threat, a clue
  found, a place reached, a thing gained or lost, someone's fate, a bond or rivalry, the players' theory, an open
  question, the world changed, something to come back later). It also has a kind of truth: it happened, the game
  master said so, someone claimed it (it may be a lie), a player's idea, or Claude's own reading. Each note carries its
  session and the time in the recording, a quote, the people, places and factions it touches, whether it is unfinished
  and what could come of it. Where the transcript makes them sure, it also says which clue was found, whose fate
  changed and who learned what.
- **Reading.** Claude reads about 24,000 characters at a time (25 to 40 minutes of talk). With each part it gets the
  campaign's people, places, factions and clues by id, who is who at the table, what is already remembered that bears
  on it, and the summary of the part before. It answers in JSON; names are matched to the campaign's people only when
  sure; malformed notes and repeats are dropped. A 4-hour session is six to eight requests, on the user's own Claude.
  Then the session's summary.
- **Nothing counts until kept.** Each note is kept, kept but unsure, changed, or marked not so (it stays, crossed out).
  "Keep all that happened and Claude is sure of" saves time. Kept notes never change the campaign by themselves:
  marking a clue found, recording a death, adding to what someone knows, or handing a deed to the consequences each
  waits for the game master's click.
- **Recall, not whole transcripts.** A question gets only the notes that bear on it: scored by its rarer words (word
  endings taken off), by the people and places it names (the one who acted counts more than the others it touched),
  and by the kind of thing it asks after ("promise", "insulted", "clue", "unfinished"). Only kept notes count, unsure
  ones marked as uncertain. Then the top 8 to 24 lines, and for "What do we remember?" a few passages of the words
  around where it was said. This stays fast with hundreds of sessions. Possible later: search by meaning with a small
  model on the device (a download of about 25 MB).

## Where it meets what Atlas already has (extended, not duplicated)

- **The copilot.**
  - Talk: the person spoken as is told what the table remembers of them and of what was asked, and knows of it only
    if they were there or were told.
  - Improvise: a new kind, "What do we remember?", answers from the memory with the session and time of each fact,
    keeping fact, claim, the players' idea and inference apart. "Does it fit?" now weighs what was said at the table,
    allowing for lies and changes made on purpose.
- **The world's events.** The council planning them (The world's time) is told of the unfinished business, oldest
  first, so the world answers what the players actually did and left undone.
- **The consequences.** "What comes of it?" hands a remembered deed, promise or insult to the consequences, with when
  it was said and how many sessions ago. Minor consequences are proposed and major ones wait for approval, as already
  built (stage H).
- **The world's history.** Kept notes appear in it ("At the table"), each with "where it was said".
- **The investigation.** A remembered clue can be marked found; a remembered "someone learned this" becomes their
  knowledge, with the session as its source; a remembered fate is recorded under Factions and people.
- **The consistency check.** It flags a death the table remembers that the world does not have, and a clue the
  table remembers finding that the tracker does not. A claim is never treated as fact.
- **Tonight.** The session's summary can go into the session's notes, from which "Previously on…" is written.
- **The players.** None of it reaches the players' screen, their copy or their phones: the players' copy and the
  players' link read only their own collections (recs, transcript, memory and sessmem are not among them).

## Live help during the session

Built: while the page writes the words as the table speaks, whoever and wherever is named brings up, on the game
master's screen only, what was remembered of them (an unfinished promise first). This needs no request to Claude and
interrupts nothing. Possible next: a check every few minutes by Claude of what was just said against what is
remembered, for contradictions and forgotten promises; optional, and it costs requests.

## Privacy

The table's consent is read aloud and ticked before recording, and kept with the recording. A red banner shows the
recording on every page, with Stop one click away; the phone shows the same. The sound can be deleted, or the words,
or all of it, and how long the sound is kept is chosen. The page says where the words are made. The recorder link is
off until opened, carries a secret address, can be replaced, and stops at once when closed; it can write only a
recording's pieces, state and words, and read only the campaign's title and session number.

## Not built yet, proposed in order

1. Whisper on the computer, with the user's yes to download: "Make the words" as a background job in the app, with
   progress, able to stop and go on; then speaker separation.
2. Voices recognised across sessions (voice prints, with each player's consent). Until then the names given carry
   over from session to session by name.
3. The optional live check by Claude.
4. Search by meaning.
5. A "● Recording" sign on the players' screen.
