# Pip's Typing Adventure

A cute, modern typing game for kids (ages 6–12), inspired by the classic **Mario Teaches Typing**.

The core mechanic is the same as the original. Letter blocks line up along the path, and your character only moves forward when you type the right letter. Each correct key makes them hop over the block to the next one, all the way to the flag.

## Play it

**Online:** https://scottiej2k.github.io/MTypingClone/

**Locally:**

```bash
npm install
npm run dev       # start the game at http://localhost:5173
npm run build     # type-check and build static files into dist/
npm test          # run the unit tests
```

The build is fully static and uses relative paths, so `dist/` can be hosted on any static file server.

### Deploying to GitHub Pages

`.github/workflows/deploy.yml` tests, builds and publishes the game every time `main` changes. You can also start it by hand from the **Actions** tab ("Deploy to GitHub Pages" → **Run workflow**).

One-time setup: in the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**.

## What's inside

**Four worlds with 23 lessons**, following the standard touch-typing order:

| World | Keys |
| --- | --- |
| Carrot Meadow | Home row: F J → D K → S L → A ; → G H → review |
| Cloud Kingdom | Top row: E I → R U → T Y → W O → Q P → review |
| Jellybean Beach | Bottom row: V M → C , → X . → Z / → B N → review |
| Starlight Castle | Alphabet Road (A–Z), Pinky Power, Pointer Stretch, Letter Mix, Grand Finale |

In each lesson, the new keys show up more often and every new key comes up at least twice. Earlier keys keep coming back for review.

**Clear feedback when a key is wrong.** No wrong key goes unnoticed, and a mistake never ends the level:
- The target block shakes and turns red, and the wrong letter floats up out of it.
- A speech bubble says *"Oops! That was D. Find F."*
- On the on-screen keyboard, the key you pressed flashes red with a ✕ while the right key keeps glowing.
- The hint bar turns pink: *"You pressed D — find F with your left pointer finger."*
- After two misses in a row, the bubble names the finger to use and the correct hand wiggles.
- A soft "bonk" sound plays (easy to tell apart from the happy success blip, but never scary).
- The results screen lists the keys that need practice.

**Teaching helpers:** an on-screen keyboard colored by finger, with bumps on F and J; two hands that light up the finger to use; and a gentle note when Caps Lock is on (Caps Lock doesn't stop the game).

**Progress and unlocks** are saved in the browser:
- Levels unlock one at a time, and worlds unlock when you finish the one before.
- There are six friends to play as: Pip the Bunny, Mochi the Kitty, Fig the Frog, Bao the Panda, Sunny the Chick and Luma the Fox. You earn a new friend by finishing each world.
- There are seven hats: Bow, Party Hat, Flower Crown, Beanie, Wizard Hat and Royal Crown, plus a no-hat option. You earn them through milestones such as a level with no mistakes, typing 500 letters, or finishing the game.
- The map shows your best accuracy on every level.

**Sound and music:** every sound is made in the browser with the Web Audio API, so there are no audio files. Each world has its own background tune. Correct keys play blips that climb the scale as your streak grows, and finishing a level plays a fanfare. Music and sound effects can be switched on and off separately.

**Modern touches:** parallax scenery, squash-and-stretch hops, particle bursts, flowers that sprout where blocks used to be, confetti, a cheer every 10 correct keys in a row, and a progress bar at the top. The layout adjusts from phones to large screens, and it respects the reduced-motion setting. You can also tap the on-screen keyboard to play on a touch screen.

## Controls

| Key | Action |
| --- | --- |
| Letters | Type the highlighted letter |
| Space / Enter | Start a level, continue |
| Esc | Pause / resume |

## Project layout

```
src/
  data/lessons.ts       worlds, themes and lesson definitions
  data/characters.ts    SVG characters and hats
  game/sequence.ts      letter-sequence generator (seeded, tested)
  game/progress.ts      saving, unlock rules, stats (tested)
  game/keyboard.ts      keyboard layout, finger map, key normalisation
  game/audio.ts         Web Audio sound effects and music
  ui/play.ts            the gameplay screen
  ui/screens.ts         title, map, friends and settings screens
  ui/keyboardView.ts    on-screen keyboard and finger-guide hands
  ui/scenery.ts         generated parallax backgrounds
```

This is a fan-made homage built from scratch. It uses no Nintendo characters, art or audio.
