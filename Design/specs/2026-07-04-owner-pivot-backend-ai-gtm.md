# SpeakSpark Owner Pivot — Backend / AI / GTM Decision Map

> Date: 2026-07-04
> Source: Jianan Feishu OpenClaw message.
> Status: capture + decision map, not implementation.

## 1. Why This Exists

Jianan's role has shifted again.

Earlier framing:

- "I am helping the original founder / partner as a technical outsourcing role."

Current feeling:

- "This project increasingly feels like something I own."

This changes the decision frame. SpeakSpark should no longer be evaluated only as a feature-delivery task. It now needs an owner-level path across:

- backend ownership
- AI API cost and necessity
- China-accessible deployment
- ICP / domain / Tencent Cloud route
- web vs mini-program rollout
- actual user scenario and GTM
- motivation / upside clarity for Jianan

## 2. Core Tension

The current product can work as a demo, but the owner question is unresolved:

```text
If Jianan owns SpeakSpark,
  -> the backend and keys should be under Jianan's control
  -> the product should have a low-cost operating model
  -> the AI layer must prove it creates habit or learning value
  -> distribution must be concrete enough to justify continued work
```

The motivation issue is rational: if the route to ownership, distribution, and benefit is fuzzy, action naturally drops.

## 3. Backend Decision Frame

### Option A — Keep Current Supabase Short Term

Use current Supabase project `jyofoabobuwfowpctbfd` while validating user demand.

Pros:

- lowest immediate engineering cost
- current app already points here
- avoids breaking Gemini proxy and session flow

Cons:

- ownership remains ambiguous
- API keys / Edge Functions are not fully under Jianan control
- long-term product and billing risk

Best use:

- short validation window only
- do not scale paid users on ambiguous infra

### Option B — Move To Jianan-Owned Supabase

Use Jianan's own Supabase project and migrate functions, keys, and schema.

Pros:

- fastest owner-controlled backend path
- free tier is enough for MVP
- auth, Postgres, storage, edge functions, RLS are already aligned with existing architecture

Cons:

- migration work required
- Edge Function deploy / secrets / RLS need careful setup
- China latency may still exist because Supabase is overseas

Best use:

- default recommended path after one short audit

### Option C — Tencent Cloud Native Backend Later

Use Tencent Cloud serverless / CloudBase / mini-program cloud backend when China and mini-program become primary.

Pros:

- better China ecosystem fit
- easier mini-program integration
- ICP / domestic domain / Tencent account alignment

Cons:

- more platform learning and migration
- may slow current product validation
- AI API routing still needs design

Best use:

- later, after web MVP proves a usage scenario

## 4. AI Necessity Frame

Do not ask "should SpeakSpark use AI?" broadly.

Ask which layer actually requires AI:

1. Speech-to-text
   - needed for transcript and mobile speaking flow
   - Deepgram / browser STT / Chinese cloud STT can be compared

2. Real-time coach prompt
   - only valuable if it makes the student keep speaking
   - metric: pause recovery rate, session completion, practice-again rate

3. Takeaway / growth record
   - valuable if it gives reusable phrases and visible progress
   - metric: user saves or reuses a phrase in the next session

4. Topic generation
   - useful, but can start with static topic library

5. Personalization
   - not needed for earliest MVP unless retention signal appears

Default early posture:

- Use cheap / fast models for most feedback.
- Use stronger models only for final takeaway or high-value moments.
- Keep a local/static fallback so AI failure never blocks the practice loop.
- Build model routing only after usage exists.

## 5. Product Scenario Reframe

Jianan's new scenario:

```text
I have an idea.
I open SpeakSpark.
I casually say two sentences.
The app catches me, gives one useful phrase or improvement,
and stores a small growth trace.
```

This is different from:

```text
I have a prepared PPT / structured speech task,
then I practice it in a formal flow.
```

These are two possible products:

### Scenario A — Prepared Speech Coach

- stronger for school projects, competitions, presentations
- clearer teacher / parent value
- lower frequency
- easier to explain as education product

### Scenario B — Anytime Two-Sentence Practice

- stronger for mobile / mini-program
- higher frequency
- harder to monetize unless growth loop is clear
- needs very low friction and fast feedback

The next product question is not "web or mini-program." It is which scenario has stronger user pull.

## 6. Web vs Mini-Program

Recommended sequence:

1. Web first for product and AI loop validation.
2. China stable custom domain + EdgeOne for shareable testing.
3. Mini-program only after the high-frequency "随时说两句" scenario proves real.

Why:

- mini-program is likely a better daily entry
- but mini-program adds platform cost, review, login, audio permission, and cloud constraints
- building it before scenario validation may create motion without proof

## 7. ICP / Domain / Tencent Cloud

Current route remains sensible:

1. Buy / use Tencent Cloud DNSPod domain.
2. Do real-name verification.
3. Bind EdgeOne Pages with custom domain.
4. Use overseas acceleration first if ICP is not ready.
5. Start ICP only if China-native stable access becomes necessary for user testing / promotion.
6. Consider Tencent Cloud resource only if ICP service code is required.

Do not let ICP become the reason product validation stalls. It is infrastructure for distribution, not a substitute for user pull.

## 8. GTM Questions

Before heavy backend migration or mini-program build, answer:

1. Who is the first real user?
   - student self-practice
   - parent-guided practice
   - teacher-assigned practice
   - institution trial

2. Who pays?
   - parent
   - school
   - teacher / institution
   - no one yet, content-led free funnel

3. What is the first wedge?
   - English science presentation
   - daily two-sentence speaking
   - interview / competition speech
   - phrase bank / reusable expression growth

4. What proof creates motivation?
   - 5 real users complete 3 sessions
   - 1 parent says they would pay
   - 1 teacher asks to use it with students
   - 1 short video/demo gets strong interest

## 9. Recommended Next 7-Day Plan

### Day 1 — Ownership Audit

- list current infra ownership: Supabase, Gemini, Deepgram, Vercel, EdgeOne, domain, repo
- mark owner / risk / migration effort

### Day 2 — Scenario Test Design

Create two user tests:

- A: prepared speech practice
- B: anytime two-sentence practice

Each test should take <5 minutes for a user.

### Day 3 — Backend Cost Decision

Decide:

- stay current Supabase for 1 week
- or migrate to Jianan-owned Supabase first

### Day 4-5 — 5 User Conversations

Talk to 3 students + 2 parents or teachers.

Ask behavior questions, not "would you like this?".

### Day 6 — GTM Hook Draft

Draft 3 hooks:

- parent hook
- student hook
- teacher / institution hook

### Day 7 — Go / Guarded-Go / Pause

Decide:

- Go: migrate backend + stable domain + run user test
- Guarded-Go: keep current backend, test scenario first
- Pause: no clear user pull / no owner upside yet

## 10. Immediate Recommendation

Do not start by rebuilding everything.

Start with:

1. owner-controlled infra audit
2. low-cost backend decision
3. two-scenario user test
4. one China-stable web link
5. one clear distribution experiment

Mini-program is a strong direction only if "随时说两句" proves to be the core behavior.

