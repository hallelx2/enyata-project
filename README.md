# AuraHealth — Enyata × Interswitch Buildathon Submission

> **Intelligent hospital triage and pre-authorized care payments for Nigeria**

AuraHealth removes the friction of emergency healthcare navigation by combining a voice AI triage agent, real-time hospital routing, and escrow-based payment pre-authorization — so patients receive care faster and hospitals receive guaranteed payment.

---

## The Problem

In Nigeria, patients facing a medical emergency must:

1. Manually search for a nearby hospital
2. Travel there without knowing if they will be admitted or have capacity
3. Negotiate billing and payment at the worst possible moment
4. Repeat this across multiple hospitals when turned away

This friction costs lives. AuraHealth solves it end-to-end.

---

## How It Works

### Hospital Side

1. A hospital registers on AuraHealth, providing name, address, and specialties
2. An admin reviews and approves (or rejects) the registration
3. Once approved, the hospital dashboard becomes active and the hospital can receive triage alerts in real time

### Patient Side

1. A patient signs up and their profile is stored along with basic health information
2. Their profile is matched against approved hospitals — the best-fit hospital is auto-linked
3. From the patient dashboard, the patient can:
   - Start a **voice triage session** with Aura, AuraHealth's AI agent
   - Submit symptoms via text if voice is unavailable
   - View triage history and escrow payment status
   - Pre-authorize a care deposit (₦5,000) at any time

### Voice Triage Agent (Aura)

The core of AuraHealth is **Aura** — a conversational AI agent that runs entirely over voice (browser WebRTC or phone):

1. Patient calls Aura from their dashboard
2. Aura asks about symptoms in a natural, empathetic conversation
3. Aura assesses severity (critical / high / medium / low) and invokes the `routeToHospital` tool
4. The server creates a triage record, assigns the patient's linked hospital, and generates a personalized routing message via Claude Haiku
5. Aura reads the message aloud and offers to pre-authorize payment
6. If the patient confirms, Aura invokes `createEscrow` — ₦5,000 is held in escrow via Interswitch
7. The hospital dashboard receives a real-time alert via Server-Sent Events and can begin preparing

### Escrow Payment Flow

- Payment pre-authorization uses **Interswitch QuickTeller** (OAuth2 + SHA-512 HMAC)
- In development/demo mode, escrow is mocked: a transaction reference (`MOCK-{timestamp}`) is generated and the status is immediately set to `held`
- On production, the full Interswitch sandbox/live flow is used
- Escrow lifecycle: `pending → held → released` (on care completion) or `refunded` (on cancellation)
- Hospitals can release escrow from the triage inbox once treatment is complete

---

## Architecture

```
Browser (Patient)
  └── VoiceTriage.tsx (@vapi-ai/web WebRTC)
        └── VAPI Cloud (GPT-4o + Deepgram + ElevenLabs)
              └── POST /api/vapi/webhook
                    ├── routeToHospital → createTriageRequest() → DB
                    │     └── generateText(claude-haiku) → routing message
                    └── createEscrow → initializeMockEscrow() → DB

Browser (Hospital)
  └── TriageInbox.tsx (EventSource SSE)
        └── GET /api/triage/stream?hospitalId=...
              └── DB poll every 5s (new triage_request rows)

Admin
  └── /admin — approve/reject hospital registrations
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router, Partial Prerender, Cache Components) |
| Runtime | Bun 1.x |
| Auth | Better Auth 1.5.6 with Drizzle adapter |
| Database | Neon PostgreSQL (serverless HTTP) |
| ORM | Drizzle ORM 0.45 |
| Styling | Tailwind CSS v4 |
| Voice AI | VAPI (GPT-4o model, Deepgram nova-3-medical, ElevenLabs) |
| AI SDK | Vercel AI SDK + @ai-sdk/anthropic (Claude Haiku) |
| Payments | Interswitch QuickTeller (mock escrow in dev) |
| Real-time | Server-Sent Events (SSE) |

---

## Features

- [x] Hospital registration with admin approval workflow
- [x] Patient registration with EMR-based hospital matching
- [x] Voice triage agent (VAPI, browser WebRTC)
- [x] Text-based triage fallback
- [x] Severity assessment (critical / high / medium / low)
- [x] Real-time triage alerts to hospital dashboard (SSE)
- [x] Triage status management (pending → in_progress → resolved)
- [x] Escrow payment pre-authorization (Interswitch / mock)
- [x] Escrow release from hospital dashboard
- [x] AI-generated personalized routing messages (Claude Haiku)
- [x] Admin dashboard for managing hospital approvals
- [x] Pending approval page for newly registered hospitals
- [x] Responsive UI with gradient design system
- [x] Production build verified (Next.js 16.2, TypeScript clean)

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- PostgreSQL database (Neon recommended)
- VAPI account + assistant
- Anthropic API key

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://...

# Better Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your_32_char_secret_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# VAPI — Voice AI
VAPI_API_KEY=your_vapi_api_key
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_assistant_id

# Anthropic — for routing message generation
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Installation

```bash
bun install
bunx drizzle-kit push   # push schema to database
bun dev                 # start dev server
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
bun run build
bun start
```

### VAPI Assistant Setup

After deploying to production, update the VAPI assistant's server URL:

```bash
# Using VAPI CLI
vapi assistant update <ASSISTANT_ID> \
  --serverUrl https://your-domain.com/api/vapi/webhook
```

---

## Project Structure

```
src/
├── app/
│   ├── admin/              # Admin dashboard (hospital approvals)
│   ├── api/
│   │   ├── auth/           # Better Auth handler
│   │   ├── escrow/         # Interswitch escrow callback
│   │   ├── triage/stream/  # SSE real-time triage alerts
│   │   └── vapi/webhook/   # VAPI tool call handler
│   ├── dashboard/
│   │   ├── hospital/       # Hospital dashboard (triage inbox)
│   │   └── patient/        # Patient dashboard (voice triage, history)
│   ├── login/
│   ├── signup/
│   ├── pending/            # Post-registration approval waiting page
│   └── page.tsx            # Landing page
├── components/
│   └── VoiceTriage.tsx     # VAPI browser voice widget
├── lib/
│   ├── auth.ts             # Better Auth server config
│   ├── auth-client.ts      # Better Auth browser client
│   ├── db/
│   │   ├── index.ts        # Drizzle + Neon client
│   │   └── schema.ts       # Database schema
│   └── interswitch.ts      # Interswitch payment utilities
└── modules/
    ├── admin/              # Admin components and actions
    ├── auth/               # Auth views (login, signup, reset)
    ├── dashboard/
    │   ├── hospital/       # Hospital dashboard view + TriageInbox
    │   └── patient/        # Patient dashboard view + triage modal
    ├── escrow/             # Escrow actions (mock + real)
    ├── landing/            # Landing page components
    ├── patient/            # Patient profile components
    └── triage/             # Triage actions (create, route, score)
```

---

## Team

**Halleluyah Darasimi Oludele** — Team Lead & Software Engineer
Full-stack engineer responsible for the entire technical implementation: Next.js architecture, VAPI voice integration, Vercel AI SDK routing, Interswitch escrow, real-time SSE infrastructure, database schema, and authentication.

**Theophilus Ayomide Olayiwola** — Product Manager & Product Designer
Responsible for product strategy, user research, UX design, and defining the problem space. Shaped the product vision from the patient and hospital perspective.

---

## Buildathon Context

This project was submitted for the **Enyata × Interswitch Buildathon**.

The core innovation is treating payment as part of the triage flow — not an afterthought. By pre-authorizing payment via Interswitch escrow *during* the voice consultation, AuraHealth eliminates the billing friction that delays care delivery in Nigerian hospitals.

The VAPI voice agent is the primary UX — patients in distress should not need to navigate an app. Speaking to Aura is as natural as calling a nurse.

---

*Built with Next.js, VAPI, Vercel AI SDK, Interswitch, and Neon PostgreSQL*
