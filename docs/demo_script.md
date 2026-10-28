# 60-Second Product Demo Script: Life, Decoded

**Target Audience**: Product reviewers, evaluators, early users, and hiring panels.  
**Estimated Duration**: Exactly 60 seconds.

---

## Prerequisites Before Presenting

1. Backend running:
   ```bash
   cd backend && uvicorn main:app --port 8000
   ```
2. Frontend running:
   ```bash
   cd frontend && npm run dev
   ```
3. Open browser at `http://localhost:5173`.

---

## Step-by-Step Walkthrough

### 0:00 – 0:10 | The Landing Page & Hook
- **Action**: Display the landing page at `http://localhost:5173`.
- **Narration**:
  > *"Most budgeting apps tell you where your money went, but they never explain why. Life, Decoded is an explainable personal analytics engine that discovers what your everyday routines might be costing you."*
- **Action**: Scroll briefly to the synthetic insight preview card. Point to the banner:
  > *"Every demo calculation is backed by reproducible math on synthetic data — with complete disclosure."*
- **Action**: Click the green **"Explore 60-Second Demo"** button.

---

### 0:10 – 0:20 | Persona Selection
- **Action**: Arrive at `/persona`. Point to the three options (Maya, Arjun, Start Fresh).
- **Narration**:
  > *"We provide isolated, versioned datasets for two young adult personas: Maya, a 23-year-old junior software analyst in Bangalore, and Arjun, a 25-year-old freelance designer in Mumbai."*
- **Action**: Click **"Select Maya"**.

---

### 0:20 – 0:35 | The Populated Dashboard
- **Action**: Arrive at `/dashboard`. The data loads dynamically from the local database.
- **Narration**:
  > *"Notice that this is a real data-driven application: total spending is ₹63,318, with convenience food representing ₹9,451. At the top of the dashboard, the Insight Engine surfaces the central finding: During high-stress weeks, convenience food spending was 3.2× higher."*
- **Action**: Point to the weekly spending trend area chart and the task overload bar chart.
- **Action**: Click **"Inspect Evidence & Calculation"**.

---

### 0:35 – 0:50 | The Insight Detail Screen (The Core Differentiator)
- **Action**: Arrive at `/insight`.
- **Narration**:
  > *"Here is the evidence screen. Rather than asserting a finding as fact, we show the exact weekly distribution. In red are the 5 qualifying weeks where Maya had 3 or more overdue tasks at the Sunday closing snapshot. In gray are the 7 baseline weeks. The qualifying average is ₹1,314 per week versus ₹411 in baseline weeks — producing the 3.20× multiple."*
- **Action**: Click **"How was this calculated?"** to expand the transparency panel.
- **Narration**:
  > *"Our calculation panel displays the exact dates, formulas, and overdue thresholds. We also explicitly label this as an empirical association — a hypothesis, not proven causation."*

---

### 0:50 – 1:00 | Trial Action & Follow-up Workflow
- **Action**: Point to the recommended action: *"When you notice 3+ tasks piling up, try preparing a simple meal instead of ordering in."*
- **Action**: Click **"I Tried This Change"**.
- **Narration**:
  > *"When the user logs an action, we explain that evaluating outcomes requires 4 subsequent calendar weeks of records. We never fabricate success just because a button was clicked."*
- **Action**: Navigate to `/settings`, demonstrate the theme toggle (Dark Mode), and highlight the **"Reset Session Data"** capability.
- **Narration**:
  > *"Transparent, reproducible, and private. That is Life, Decoded."*

