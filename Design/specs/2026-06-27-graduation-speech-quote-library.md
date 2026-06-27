# Spec — Graduation Speech Quote Library for SpeakSpark

**Date:** 2026-06-27  
**Source:** Jianan Feishu idea  
**Status:** captured / ready for product validation  
**Related PRD modules:** Phrase Reuse Bank, Takeaway Builder, Say It Like This, Start Page Starter, Growth Memory

## 1. Idea

Use high-quality graduation speeches, such as Harvard, Stanford, MIT, Yale, and other commencement addresses, as a source for SpeakSpark's quote and expression library.

These speeches often contain short, memorable, value-dense lines. They are especially suitable for middle-school speaking practice because they combine:

- clear English expression
- strong values and life themes
- emotional resonance
- repeatable sentence patterns
- public-speaking rhythm
- topics suitable for science, growth, courage, curiosity, resilience, and future orientation

## 2. Why This Fits SpeakSpark

SpeakSpark is not just helping students speak more. It should help them gradually build a reusable bank of better expressions.

Graduation speeches can become a content seed for:

1. **Quote Library** — memorable lines students can learn and reuse.
2. **Say It Like This** — polished sentence alternatives after a practice session.
3. **Phrase Reuse Bank** — save strong expressions for future talks.
4. **Starter Prompts** — start a practice session with a meaningful line.
5. **Takeaway Builder** — turn a student's rough idea into a more speech-ready sentence.
6. **Personal Growth Memory** — track which themes and expressions the student has learned.

## 3. Product Hypothesis

If SpeakSpark gives students a curated library of inspiring, speech-ready lines, then students will be more likely to:

- feel that their speech sounds better
- reuse stronger phrases in future practices
- stay motivated after practice
- form a sense of personal expression style
- share or save their favorite lines

For parents and teachers, this also makes the product feel more educational and premium than a generic speaking chatbot.

## 4. Content Source Types

Recommended source categories:

1. **University commencement speeches**
   - Harvard
   - Stanford
   - MIT
   - Yale
   - Princeton
   - Columbia
   - Oxford / Cambridge public lectures when suitable

2. **Science and innovation speeches**
   - Nobel lecture excerpts
   - scientist public talks
   - inventor and entrepreneur speeches
   - climate / space / AI / biology themed public talks

3. **Youth-friendly public speaking clips**
   - TED-Ed / TED style excerpts
   - student science fair speeches
   - debate and public-speaking examples

## 5. Copyright and Safety Boundary

Do not store full copyrighted transcripts in the product.

Recommended handling:

- Store source metadata and official links.
- Store only short quote excerpts when legally appropriate.
- Prefer public official transcripts, official university pages, and officially posted videos.
- Transform quotes into practice cards: explanation, paraphrase, sentence pattern, and speaking prompt.
- For longer passages, store a summary or teaching note instead of verbatim text.
- Keep a `source_url` and `source_type` for every quote card.

## 6. Quote Card Data Model

A quote card should include:

```ts
type QuoteCard = {
  id: string;
  quote: string;
  speaker: string;
  school_or_event: string;
  year?: number;
  source_url: string;
  source_type: 'official_transcript' | 'official_video' | 'public_article' | 'manual_curated';
  theme_tags: string[];
  language_level: 'easy' | 'medium' | 'advanced';
  sentence_pattern: string;
  plain_english_meaning: string;
  chinese_explanation?: string;
  practice_prompt: string;
  follow_up_question: string;
  reuse_example: string;
  safety_notes?: string;
};
```

## 7. Example Card Shape

```json
{
  "quote": "Your time is limited, so don't waste it living someone else's life.",
  "speaker": "Steve Jobs",
  "school_or_event": "Stanford Commencement",
  "year": 2005,
  "theme_tags": ["courage", "choice", "identity"],
  "language_level": "medium",
  "sentence_pattern": "Your ___ is limited, so don't waste it ___.",
  "plain_english_meaning": "You should use your life to make your own choices.",
  "practice_prompt": "Talk about one choice that feels important to you.",
  "follow_up_question": "What is one thing you want to choose for yourself?",
  "reuse_example": "My chance is limited, so I don't want to waste it being afraid."
}
```

## 8. Product Entry Points

### Start Page

Show one optional quote starter:

- Quote of the day
- theme tag
- one speaking prompt
- one-tap start

### Practice Page

When the student says something related, SpeakSpark can surface a matching sentence pattern:

- "Say it like this"
- "Stronger version"
- "Speech-ready line"

### Takeaway Page

Add a block:

- Saved line
- Try this next time
- Your own version

### My Page

Add a Phrase Reuse Bank section:

- saved quotes
- learned patterns
- reused lines
- favorite themes

## 9. Validation Plan

### V0 Manual Seed

Create 20 quote cards manually from official sources.

Suggested split:

- 5 courage / identity
- 5 curiosity / science
- 5 resilience / failure
- 5 future / responsibility

### User Test

Use the quote library with 5-10 students.

Observe:

- Do they understand the line?
- Do they want to speak from it?
- Do they reuse the pattern?
- Do they save the quote?
- Do parents or teachers see educational value?

### Metrics

- Quote starter click rate
- first-speech start rate
- saved quote rate
- phrase reuse rate within 7 days
- practice completion rate
- parent/teacher perceived value

## 10. Go-To-Market Implication

This feature can support both to-C and to-school narratives.

### To C

Positioning:

- "让孩子每天学一句真正高级、能开口用出来的英文表达。"
- "不是背金句，而是把金句变成自己的表达。"

### To School

Positioning:

- curated public-speaking expression library
- values and growth education
- speaking prompts for classroom warm-up
- reusable sentence patterns for presentation training

## 11. Next Actions

1. Build a first seed list of 20 graduation-speech quote cards.
2. Add a lightweight `QuoteCard` JSON schema to product docs or data seed.
3. Test one quote starter on the Start page.
4. Add one Takeaway block: "Save this line for next time".
5. Track whether students reuse a quote or sentence pattern in later practice.

