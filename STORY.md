# AuraHealth: The Story Behind the Build

## The Problem That Sparked Everything

In Nigeria, a medical emergency doesn't just fight your body — it fights your wallet at every single step.

Picture this: a patient is rushed to a hospital. Before admission, they pay. Before a bed is assigned, they pay again. Before diagnostics, another payment queue. Before the pharmacy dispenses medication, yet another. Before a procedure can begin — you guessed it — *pay first*.

Each of these payments is separate. Each requires cash or a trip to the billing desk. And each one must be settled **before** care is delivered. Not after. Not during. *Before*.

This isn't a hypothetical. This is how healthcare works for millions of Nigerians every day. And when every minute matters — when someone is bleeding, struggling to breathe, or losing consciousness — the payment queue becomes the deadliest waiting room of all.

---

## The Hackathon: Enyata × Interswitch Buildathon

The **Enyata × Interswitch Buildathon** posed a challenge: build something meaningful with Interswitch's payment infrastructure. Most teams would build e-commerce platforms, fintech dashboards, or bill-splitting apps. Reasonable choices. Safe choices.

I chose to build something that could save lives.

The question I couldn't shake was deceptively simple: *What if a patient never had to stop for payment during an emergency?* What if, by the time they walked through the hospital doors, the money was already sorted — held securely, guaranteed to the hospital, but protected for the patient?

That question became **AuraHealth**.

---

## What AuraHealth Actually Is

AuraHealth is an AI-powered emergency healthcare platform that collapses the entire payment journey into a single moment — before the patient even arrives at the hospital.

Here's how it works:

### 1. You Speak. Aura Listens.

The patient — maybe in a cab, maybe in an ambulance, maybe walking themselves to the nearest clinic — opens AuraHealth and starts a voice call with **Aura**, our AI triage agent.

> *"Hi, I am Aura. What brings you in today?"*

No forms. No dropdowns. No medical jargon to navigate. The patient simply speaks in natural language: *"I've been having chest pains since this morning and I'm feeling dizzy."*

Behind the scenes, Aura is powered by a symphony of AI:
- **Deepgram's nova-3-medical** model transcribes speech with clinical-grade accuracy
- **GPT-4o** drives the conversational agent
- **ElevenLabs** synthesizes a calm, reassuring voice
- **Google Gemini 2.5 Pro** performs the actual medical reasoning

In roughly 90 seconds, Aura has:
- Understood the symptoms
- Assessed severity (critical, high, medium, or low)
- Generated differential diagnoses
- Written a clinical summary for the receiving doctor
- Selected the best hospital based on their specialties, available beds, ICU capacity, and current resource inventory

### 2. One Payment. Zero Friction.

After triage, Aura asks one question:

> *"I've found Lagos General — they have the right specialists and available beds for you. Shall I pre-authorise ₦5,000 for your care?"*

The patient says yes. A single escrow payment is initiated through **Interswitch QuickTeller** (with Paystack as a fallback). The patient pays once — via card, bank transfer, USSD, or mobile wallet — and the funds are held in a secure escrow.

The hospital immediately sees a **"Guaranteed"** payment status. The patient is financially cleared before they walk through the door.

No admission payment queue. No ward allocation payment. No pharmacy payment. No procedure payment. One escrow covers the entire episode of care.

### 3. The Hospital Knows You're Coming

This is where it gets powerful. By the time the patient arrives, the hospital has already received — in real-time via server-sent events:

- The patient's name and contact information
- AI-generated differential diagnoses (3-5 medical possibilities)
- A clinical summary written for doctors, not patients
- Severity classification
- Confirmed escrow guarantee

The doctor isn't starting from zero. They have clinical context *before the patient walks in*. This isn't just about payment — it's about preparedness.

### 4. After Treatment: Smart Settlement

Once treatment is complete, the hospital clicks one button to release the escrow. Funds transfer from AuraHealth's escrow wallet directly to the hospital's registered bank account via Interswitch Payouts.

If the actual cost was less than ₦5,000? The remainder is refunded to the patient. Automatically.

---

## What I Actually Built

This wasn't a mockup. This wasn't a pitch deck with wireframes. This was a **production-grade, full-stack platform** with real payment processing, real AI, and real-time coordination between three distinct user types.

### The Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router with Cache Components) |
| Runtime | Bun |
| Language | TypeScript (end-to-end type safety) |
| Database | Neon PostgreSQL (serverless) |
| ORM | Drizzle ORM |
| Auth | Better Auth with role-based access |
| Styling | Tailwind CSS v4 |
| Voice AI | VAPI (WebRTC) + GPT-4o + Deepgram + ElevenLabs |
| Medical AI | Google Vertex AI (Gemini 2.5 Pro) |
| Payments | Interswitch QuickTeller + Paystack |
| Real-time | Server-Sent Events |
| Deployment | Vercel |

### The Database: 8 Tables, One Coherent System

- **`user`** — Patients, hospitals, and admins with role-based access
- **`session` / `account` / `verification`** — Full authentication lifecycle
- **`emrRecord`** — Hospital EMR data with auto-matching to patient registrations
- **`patientHospitalLink`** — The relationship graph between patients and hospitals
- **`escrowTransaction`** — Complete payment escrow lifecycle (pending → held → released/refunded)
- **`triageRequest`** — Every triage record with AI-generated clinical data
- **`hospitalProfile`** — Hospital capabilities, specialties, and capacity
- **`hospitalResource`** — Live inventory of beds, equipment, medicines, and procedures with pricing

### Three Complete Dashboards

**Patient Dashboard** — Start voice triage, view triage history, manage hospital links, track escrow payments, receive real-time status updates.

**Hospital Dashboard** — Real-time triage inbox with severity badges, patient management, resource inventory, EMR sync, profile configuration, escrow release controls.

**Admin Dashboard** — Hospital approval/rejection, platform oversight, aggregate statistics.

### The Payment Integration (The Hard Part)

Interswitch doesn't have a native escrow API. I had to build the escrow logic myself:

1. **OAuth 2.0 authentication** — Server-to-server token exchange with Interswitch
2. **Payment link generation** — Via the Pay Bill API with SHA-512 signed redirect URLs
3. **Hosted payment page** — Patient completes payment on Interswitch's secure page
4. **Server-side verification** — Transaction status check before marking escrow as held
5. **Webhook processing** — HMAC-SHA-512 verified notifications for async updates
6. **Payout disbursement** — Automated transfer to hospital bank accounts

Amount verification, timing-safe signature comparison, and idempotent webhook handling — all implemented. No shortcuts.

### The AI Pipeline

The triage assessment isn't a simple keyword match. When a patient describes symptoms, here's what happens:

1. VAPI captures the voice call via WebRTC
2. Deepgram transcribes with medical vocabulary awareness
3. The transcript hits a VAPI webhook on my server
4. My server calls Gemini 2.5 Pro with a carefully crafted prompt that includes:
   - The patient's symptoms and severity indicators
   - The hospital's specialties
   - The hospital's **current** resource availability (live bed counts, equipment, medicines)
5. Gemini returns:
   - A warm routing message (read aloud to the patient)
   - 3-5 differential diagnoses (medical terms for the doctor)
   - A 2-3 sentence clinical summary (clinical reasoning, not patient-friendly text)
6. Everything is persisted to the database and streamed to the hospital in real-time

### EMR Auto-Matching

When a patient registers with their email or phone number, the system automatically searches every hospital's EMR records. If there's a match, the patient is instantly linked to that hospital — no paperwork, no waiting.

This means returning patients can be recognized immediately. Their medical history (conditions, allergies, blood type) is already available to the hospital before the triage even begins.

---

## The Hackathon Result

I didn't win.

Let me sit with that for a moment, because it matters. I poured myself into this project — the architecture, the AI pipeline, the payment integration, the real-time systems, the UX for three different user types. I built something that could genuinely change how emergency healthcare works in Nigeria.

And I didn't win.

---

## But I Won Anyway

Here's what I walked away with:

### I Built Something Real

AuraHealth isn't a concept. It's deployed at [aurahealth-five.vercel.app](https://aurahealth-five.vercel.app). You can sign up as a patient, register as a hospital, import EMR data, start a voice triage call, receive AI-generated clinical assessments, and process payments through Interswitch. It works.

### I Solved a Real Problem

The payment friction in Nigerian healthcare isn't a niche issue — it's a systemic failure that costs lives. AuraHealth doesn't just identify the problem; it architects a complete solution. Voice-first triage for accessibility. Escrow for trust. AI for clinical intelligence. Real-time coordination for speed.

### I Pushed My Technical Boundaries

- **Next.js 16.2** — Not the stable version everyone knows. The bleeding edge with Cache Components, `unstable_instant` navigation, and `'use cache'` directives. I had to read the framework's internal docs in `node_modules` because the public documentation hadn't caught up yet.
- **Interswitch Payment Integration** — No escrow API exists, so I built one. OAuth flows, signed URLs, webhook verification, payout disbursement — all from the ground up.
- **VAPI + Multi-Model AI** — Orchestrating four AI services (GPT-4o, Deepgram, ElevenLabs, Gemini) through a single voice call with server-side webhook processing.
- **Real-time Architecture** — Server-Sent Events with database polling, supporting simultaneous streams for patients and hospitals.

### I Proved the Concept

The hardest part of healthcare innovation isn't the technology — it's proving that technology can fit into the messy, human reality of hospitals and patients. AuraHealth demonstrates that:

- A 90-second voice call can replace a 30-minute intake process
- A single escrow payment can eliminate five separate payment queues
- AI can generate clinically useful assessments, not just chatbot responses
- Real-time coordination can prepare a hospital before the patient arrives

---

## The Vision That Remains

AuraHealth was built for a hackathon, but the problem it solves didn't end when the hackathon did.

The next steps are clear:
- **Real EMR integration** — HL7/FHIR standards instead of simulated data
- **Insurance/HMO support** — Direct billing to insurers, not just patient escrow
- **Interswitch KYC** — Identity verification for both patients and hospitals
- **Analytics** — Hospital performance metrics, triage patterns, payment trends
- **Multi-language voice support** — Yoruba, Igbo, Hausa, Pidgin — because emergencies don't wait for English

---

## The Lesson

Hackathons measure who built the best pitch in a weekend. But building isn't about weekends or pitches. Building is about seeing a problem so clearly that you can't *not* build the solution.

I saw patients dying in payment queues. I saw hospitals turning away emergencies because there was no financial guarantee. I saw a system where the technology to fix this already existed — voice AI, escrow payments, real-time data — but nobody had connected the dots.

So I connected them.

I didn't win the hackathon. But I built **AuraHealth** — a platform that proves emergency healthcare doesn't have to have a billing desk between a patient and their treatment.

And that? That's the only win that matters.

---

*Built by a developer who believes technology should serve the most vulnerable moments of human life.*

*Live at: [aurahealth-five.vercel.app](https://aurahealth-five.vercel.app)*
