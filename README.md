# 🎓 CampusConnect Ghana

A personalized platform where Ghanaian tertiary students discover opportunities that actually match their interests — not just a random list of events.

## The Problem

Students miss scholarships, internships, workshops, and competitions because they're buried in WhatsApp groups or scattered across posters no one reads. Generic event lists don't work — students ignore what's not relevant to them.

## Our Solution

CampusConnect profiles each student during signup — their institution, course, year, interests, goals, and preferred formats. Then we match them to opportunities that fit. Organizers post events with tags, and the right students see them first.

## How It Works

**For Students:**

1. Sign up and complete a quick profile (6 questions)
2. See a personalized feed of opportunities ranked by relevance
3. Save events you're interested in
4. Never miss a deadline again

**For Organizers:**

1. Sign up as an organizer
2. Post events with category, target fields, and eligibility
3. Reach the right students automatically

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Firebase Authentication + Firestore
- **Editor:** Cursor AI

## Project Structure

```
campusconnect-ghana/
├── login.html          # Login and signup page
├── onboarding.html     # Student profile questionnaire
├── index.html          # Student dashboard (personalized feed)
├── event.html          # Event detail page
├── submit.html         # Organizer event submission
├── saved.html          # Student's saved events
├── css/
│   └── style.css       # All styles
├── js/
│   ├── firebase-config.js  # Firebase setup
│   ├── auth.js             # Login/signup/logout logic
│   ├── onboarding.js       # Profile questionnaire logic
│   ├── events.js           # Fetch and display events
│   ├── matching.js         # Relevance scoring algorithm
│   └── seed.js             # Sample event data
```

## Team

- **Kobby** — Frontend (HTML pages + CSS)
- **Nana** — Backend (Firebase + matching logic)
- **[Your Name]** — Systems (Auth + integration + coordination)

## Getting Started

1. Clone the repo:

```
   git clone https://github.com/[username]/campusconnect-ghana.git
```

2. Open the folder in Cursor

3. Add Firebase config to `js/firebase-config.js`

4. Open `login.html` in your browser to start

## Built For

ALU Hackathon 2026 — Solving real problems for Ghanaian students 🇬🇭
