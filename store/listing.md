# Google Play listing

Everything needed to fill in Play Console for the first release (no ads), plus
the assets beside this file. Limits are Play's; the counts in brackets are what
the text actually uses. Written in **en-GB**, like the other Sparkle titles.

---

## 1. The build

| | |
|---|---|
| Package | `com.sparklesuite.euchre` (permanent, can never change) |
| Version | 1.0.0 |
| EAS project | `@discussionforall/Euchre-cards-game` |
| Preview APK (testing only, not for Play) | https://expo.dev/artifacts/eas/A7Lg2eAY-3-4YfndsPmbBYF1wjiRcFtejFZEtZFDv3o.apk |
| Production AAB | **not built yet** |

Play needs the **`.aab`** from a production build, not the preview APK:

```
npx eas-cli@latest build -p android --profile production
```

Build it **after** the unused-permissions fix in `app.json` is in place
(`blockedPermissions`), so the uploaded build only declares `INTERNET`. The
preview APK above was built before that fix.

Upload it in **Test and release → Internal testing → Create new release**
first, install it from the Play test link on your phone, then promote the same
release to Closed/Production.

**Play App Signing:** accept the default on the first upload. EAS holds the
*upload* key it generated; Google holds the key that signs what users download.
Back the upload key up now (`npx eas-cli@latest credentials` → Android →
download keystore). If it's lost you have to ask Google to reset it before you
can ship an update.

`eas.json` uses `appVersionSource: "remote"`, so EAS bumps versionCode on every
production build. Don't add a versionCode to `app.json`: Play rejects a
duplicate.

---

## 2. Store listing

**App name** (30): `Euchre: Classic Card Game` [25]

**Short description** (80). Pick one:

```
Classic Euchre against smart computer players. Call trump and take the tricks!
```
[78] Leads with what you actually do.

```
Team up with a computer partner, call trump and race to 10. Real Euchre rules.
```
[78] Leads with the partnership, which is what makes Euchre Euchre.

```
The classic trick-taking card game. Bowers, going alone and stick the dealer.
```
[77] Speaks to people who already know the game and want the real rules.

**Full description** (4000) [1527]:

```
Euchre is the classic trick-taking card game, ready to play whenever you are. Team up with a computer partner, take on two computer opponents, and be the first team to 10 points.

THE REAL RULES
- 24-card deck, five cards each
- The right and left bowers: the Jacks that rule every hand
- Two rounds of bidding to choose trump, with stick the dealer
- Follow suit, take tricks, and watch out for being euchred
- Score 1 point for 3 tricks, 2 for a march, and 4 for going alone

GO ALONE
Holding a monster hand? Call trump, send your partner to sit the hand out, and take all five tricks on your own for 4 points.

SMART COMPUTER PLAYERS
Your partner and opponents bid, discard and play like real Euchre players. They judge their hands, lead their aces, pull trump and avoid taking a trick their partner has already won. And they never peek at your cards.

CLEAR AND SMOOTH
- Cards are dealt and played across the felt with smooth animations
- The cards you can legally play lift up, so you always know your options
- Every trump call is announced, so you never miss who chose what
- Pick Normal or Fast speed for the computer players

NEW TO EUCHRE?
The How to play guide explains trump, the bowers, bidding, going alone and scoring, with real cards to show you how it works.

TRACK YOUR RECORD
Games played, games won, win rate and your best winning streak, right on the home screen.

PLAY ANYWHERE
- Plays fully offline, even in aeroplane mode
- No account or sign-in needed
- Free to play, no purchases

Shuffle up and deal!
```

**The description deliberately doesn't say "no ads".** It's true for this
release, but if ads come in a later update, a "no ads" line would have to be
removed then, and players who installed because of it leave one-star reviews
when ads appear. (The landing page in `sparkle-projects-site/euchre-card-game/`
does say "Offline, no ads": change that card in the same update as ads.)

**Store settings:**

| Field | Value |
|---|---|
| App or game | Game |
| Category | Card |
| Tags (up to 5) | Pick from Play's list, e.g. Card, Classic, Offline, Single player, Trick-taking (if offered) |
| Email | the one used for the other Sparkle titles |
| Website | `https://apps.sparkleinfotech.com/euchre-card-game/` (page in `sparkle-projects-site/euchre-card-game/`) |
| Privacy policy | `https://sites.google.com/view/euchre-game/home` |

---

## 3. Graphics

| Play field | File | Spec | Status |
|---|---|---|---|
| App icon | `play-icon-512.png` | 512x512 PNG | ✅ |
| Feature graphic | `feature-graphic-1024x500.png` | 1024x500, no alpha | ✅ |
| Phone screenshots | `screenshots/phone-01..06` | 2–8 images, long side ≤ 2× short side | ✅ 1212x2424, exactly 2:1 |
| 7" / 10" tablet screenshots | — | — | only if you list tablets |

The icon and feature graphic are drawn by `python3 scripts/make-store-graphics.py`
(same card artwork as the app icon, from `scripts/make-icons.py`).

**Screenshots:** upload `phone-01` to `phone-06` in order: Home, game table,
hand result, How to play (×2), Settings. The phone captures are 1080x2424,
which is taller than Play's 2:1 limit, so `python3 scripts/prepare-screenshots.py`
widens each one to 1212x2424 by extending its own edge colours. Nothing is
cropped. The originals are in `screenshots/raw/`.

**Worth re-capturing once the next build is out:** a mid-trick shot (cards on
the table, a winning card highlighted) shows the game better than two rules
pages. Put new captures in `screenshots/raw/`, named in order, and re-run the
script. A good set:

1. Home screen with the four Jacks
2. Mid-trick, cards on the table, playable cards lifted in your hand
3. The trump banner ("West ordered up ♣ Clubs")
4. Going alone: partner sitting out
5. Hand result or "You win!" with the falling suits
6. How to play (bowers section)

---

## 4. Data safety

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **No** |
| Is all user data encrypted in transit? | Not applicable, nothing is transmitted |
| Do you provide a way for users to request that their data is deleted? | Not applicable |

Verified in the code: the game makes **no network requests**. There's no
analytics, no crash reporting, no ads SDK and no account. Your record (games
played, won, lost, streaks) and the bot speed setting are saved on the device
only (AsyncStorage). **Settings → Reset record** clears the record, and
uninstalling removes everything.

**This changes with any ads update.** AdMob reads the Advertising ID and
device data, so Data safety, the privacy policy and the Ads declaration all
need updating in the same release that adds ads.

---

## 5. Content rating (IARC questionnaire)

Category: **Game**.

| Question | Answer |
|---|---|
| Violence | No |
| Blood, gore | No |
| Scary content | No |
| Sexuality, nudity | No |
| Language | No |
| Controlled substances | No |
| Gambling, simulated gambling | No (see note) |
| Users can interact or exchange content | No |
| Shares user location | No |
| Allows purchases | No |
| Contains ads | No |

**On gambling:** Euchre is a trick-taking card game. There's no betting, no
wagering, no casino games, no chips and nothing of value to win or lose, only
points within a game. Answer the gambling questions **No**. Expected outcome:
**PEGI 3 / ESRB Everyone**.

---

## 6. Privacy policy

Published on Google Sites, the same way as the other titles:

`https://sites.google.com/view/euchre-game/home`

Paste it into **Store settings → Privacy policy**. The source text is
`privacy-policy-content.md` (and `privacy-policy.html` is the same text as a
standalone page, regenerated by `python3 scripts/make-privacy-page.py`).

The policy says plainly that there are no ads, no analytics and no network
requests. That's true for this build, and **it stops being true with an ads
update**. Rewrite it before that release goes out.

---

## 7. Other declarations

| Section | Answer |
|---|---|
| Ads | No, my app does not contain ads |
| App access | All functionality available without special access |
| Target audience | See below |
| News app | No |
| Government app | No |
| Financial features | None |
| Health | No |
| Data safety | Section 4 |

**Target audience: recommend 13+ only** (13–15, 16–17, 18+). Euchre is a
traditional adult/family card game with plain artwork, no characters and
nothing aimed at children, so it doesn't fall under Google's Families policy.
Keeping it 13+ also means a future ads update can use normal AdMob settings
instead of the stricter Families rules. If you'd rather include under-13
groups, this release already qualifies (no ads, no data), but any ads added
later must then follow the Families rules from the start.

---

## 8. Before you press publish

- [ ] Commit the `blockedPermissions` fix, then build the production `.aab`
- [ ] Back up the upload keystore (`npx eas-cli@latest credentials`)
- [x] Privacy policy live at a public URL
- [x] Store icon, feature graphic and 2:1 screenshots ready
- [ ] Data safety, content rating, target audience, ads declaration completed
- [ ] Upload the `.aab` to **Internal testing** and install it via the Play link
- [ ] Check whether the Play account is an **organisation** or **personal**
      account. Personal accounts created since Nov 2023 must run a closed test
      with **12 testers for 14 continuous days** before Production unlocks.
      Organisation accounts are exempt.

---

## 9. For the next build

Not blockers for this release:

- **Dark ♠ and ♣ on the felt.** In on-table text ("Make ♠ trump?", "Trump: You
  called ♣") Android draws the black suits as fixed dark emoji that ignore the
  text colour, so they're hard to see on the green. Adding the text-style
  variation selector (U+FE0E) to on-felt suit symbols fixes it. Cards are
  unaffected.
- **An unfinished game isn't saved** when the app is closed; Continue only
  works while the app is open.
