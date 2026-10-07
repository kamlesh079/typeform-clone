# Formly — Typeform Clone

A full-stack Typeform-inspired form builder developed as an SDE Fullstack
assignment.

Formly allows a creator to build, edit, reorder, publish and manage forms.
Published forms can be shared through a public URL and filled without
authentication using a one-question-at-a-time conversational experience.

---

## Features

### Form Builder

- Create forms with a title
- Add, edit and delete questions
- Drag-and-drop question reordering
- Live form preview
- Required question toggle
- Optional description/help text
- Supported question types:
  - Short text
  - Long text
  - Multiple choice
  - Dropdown
  - Email
  - Number
  - Yes/No
  - Rating (1–5)

### Form Management

- View all forms
- Draft/published status
- Response count
- Rename forms
- Duplicate forms
- Delete forms
- Publish/unpublish forms
- Generate a shareable public form URL

### Respondent Experience

- Public form filling without authentication
- One question displayed at a time
- Progress indicator
- Smooth transitions between questions
- Enter-key navigation
- Back navigation
- Required-field validation
- Email validation
- Number validation
- Choice validation
- Rating validation
- Thank-you screen after submission

### Results

- View all responses for a form
- View individual submissions
- Display submitted answers
- Basic summary statistics for choice-based questions
- Persistent response storage

### Placeholder / Coming Soon Features

The following features are represented as placeholders where applicable:

- Advanced logic jumps / branching
- Integrations / webhooks
- Team collaboration
- Payments
- File uploads

Optional bonus features such as CSV export, custom themes and dark mode
are not required for the core implementation.

---

# Tech Stack

## Frontend

- Next.js 14
- TypeScript
- React
- Tailwind CSS
- dnd-kit
- Framer Motion

## Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- Uvicorn

## Database

- SQLite

---

# Project Structure

```text
typeform-clone/
│
├── frontend/
│   ├── app/
│   │   ├── builder/
│   │   │   └── [id]/
│   │   ├── form/
│   │   │   └── [slug]/
│   │   ├── results/
│   │   │   └── [id]/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── QuestionEditor.tsx
│   │   ├── SortableQuestion.tsx
│   │   └── Toast.tsx
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   └── types.ts
│   │
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   └── database.py
│   │   ├── models/
│   │   │   └── models.py
│   │   ├── routers/
│   │   │   └── forms.py
│   │   ├── schemas/
│   │   │   └── forms.py
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── seed.py
│
└── README.md