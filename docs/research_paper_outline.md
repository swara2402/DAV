# Research Paper Outline: Life, Decoded

**Target Venue**: ACM Conference on Human Factors in Computing Systems (CHI) / ACM UbiComp / Personal Informatics Workshop  
**Working Title**: *Life, Decoded: Uncovering Behavioral Associations Between Task Overload and Convenience Consumption Through Explainable Personal Analytics*

---

## 1. Abstract
Young adults (aged 21–26) navigating early-career independence often encounter hidden feedback loops between cognitive workload stress and discretionary consumption. Traditional personal financial management (PFM) tools emphasize rigid budgeting categories without exposing the behavioral antecedents that drive spending spikes. In this paper, we present **Life, Decoded**, an explainable personal behavioral analytics system that discovers, visualizes, and contextualizes correlations between task overload (specifically, overdue task accumulation) and convenience food spending. Life, Decoded computes findings deterministically from individual transaction and task records, providing complete algorithmic transparency through historical weekly snapshot reconstruction. In a synthetic technical evaluation spanning two benchmark personas (Maya and Arjun) over 12 calendar weeks, the system identified a 3.20× and 3.42× spending differential in high-stress weeks compared to baseline. We detail the system architecture, mathematical snapshot methodology, and design choices prioritizing honest uncertainty, concluding with an agenda for future longitudinal user studies.

---

## 2. Introduction & Problem Statement
- **Transition to Independence**: Young professionals face simultaneous challenges in self-directed task management and personal financial solvency.
- **The "Convenience Food" Paradox**: High workload stress triggers decision fatigue and ego depletion, rendering food delivery the default coping mechanism.
- **Deficiencies of Traditional Budgeting**: Existing apps (Mint, YNAB, Monarch) treat transactions as isolated accounting entries rather than behavioral artifacts.
- **The Explainability Gap**: Commercial analytics dashboards frequently present ungrounded suggestions or black-box predictions without mathematical transparency.
- **Core Contribution**: A reproducible personal analytics architecture pairing historical temporal snapshots with transparent statistical reporting and follow-up outcome evaluation.

---

## 3. Related Work
- **Personal Informatics & Quantified Self**:
  - Li, Dey, & Forlizzi (2010): Stage-based model of personal informatics systems.
  - Epstein et al. (2015): Lived informatics and barriers to sustained tracking.
- **Behavioral Economics & Decision Fatigue**:
  - Kahneman (2011): Dual-process theory, cognitive load, and decision fatigue.
  - Baumeister et al. (1998): Ego depletion and impulse control in spending.
- **Explainable AI (XAI) & Algorithmic Trust**:
  - Miller (2019): Explanation in artificial intelligence and personal decision support.
  - Kulesza et al. (2015): Principles of explanatory debugging and user agency.

---

## 4. Objectives & Research Questions
- **RQ1 (Technical Feasibility)**: Can a lightweight personal analytics engine reliably distinguish workload-induced spending anomalies from baseline variance using weekly temporal snapshots?
- **RQ2 (Transparency & Trust)**: How does exposing raw mathematical formulas, group counts, and snapshot timestamps impact user perception of statistical credibility?
- **RQ3 (Behavioral Uptake)**: Does explicit follow-up tracking with a mandatory 4-week observation window foster realistic expectations compared to immediate-reward gamification?

---

## 5. Data Generation & Data Dictionary
- **Deterministic Synthetic Benchmark**:
  - 12-week standardized observation window ($W = 84$ days).
  - Seed-fixed probabilistic generation ($RNG(42)$).
- **Persona Archetypes**:
  - Maya: 23, Bangalore, fixed salary, deadline sprint crunches.
  - Arjun: 25, Mumbai, freelancer, milestone deliverable crunches.
- **Schema Specification**:
  - Unified data dictionary covering `expenses`, `tasks`, `profiles`, `insights`, and `actions` (see `docs/data_dictionary.md`).

---

## 6. System Architecture
- **Frontend**: React 19, TypeScript, Tailwind CSS, Recharts, Vite.
- **Backend**: Python 3.14, FastAPI, Pandas, NumPy.
- **Data Layer**: SQLite (development/demo) / Supabase PostgreSQL with Row Level Security (production).
- **Security**: Cryptographic JWT validation, zero credential scraping, strict horizontal user isolation.

---

## 7. Insight Methodology & Formulas
- Formal definition of the weekly snapshot condition:
  $$\text{Overdue}(T, S_i) \iff d(T) \le s_i \land \left( c(T) \text{ is } \emptyset \lor c(T) > s_i \right)$$
- Weekly convenience spending aggregation:
  $$C_i = \sum_{e \in \mathcal{E}_{w_i}, \text{category}(e) = \text{'convenience\_food'}} \text{amount}(e)$$
- Cohort partition threshold ($\theta = 3$) and comparison ratio calculation:
  $$R = \frac{\mu_{\mathcal{Q}}}{\mu_{\mathcal{B}}}$$
- Minimum statistical sufficiency thresholds ($\ge 8$ total weeks, $\ge 3$ qualifying weeks, $\ge 3$ baseline weeks, $\mu_{\mathcal{B}} > 0$).

---

## 8. Visualizations
- **Cohort Evidence Bar Chart**: Visual comparison of weekly spending with color-coded classification (red = qualifying, gray = baseline) and horizontal dashed lines for cohort means.
- **Multi-Period Spending Trends**: Area chart displaying total expenditure against convenience food delivery.
- **Calculation Transparency Panel**: Collapsible drawer exposing exact formulas, parameter values, sample sizes, and engine versions.

---

## 9. Evaluation Methodology
- **Completed Technical Verification**:
  - Automated unit test suite (18 pytest test cases) covering grouping logic, historical snapshot reconstruction, and edge condition handling.
  - Schema consistency validator (32 assertions) verifying temporal integrity across generated synthetic datasets.
  - Frontend component and utility tests (5 Vitest unit tests).
- **Proposed Future Longitudinal User Study**:
  - Within-subjects 8-week diary study ($N = 30$ young adults aged 21–26).
  - Pre- and post-intervention evaluations measuring cognitive load awareness, spending self-efficacy, and algorithmic trust.

---

## 10. Actual Experimental Results (Synthetic Technical Evaluation)

> [!NOTE]
> All figures reported below derive from automated testing of our synthetic technical fixtures. No human user study data has been fabricated.

| Persona | Expense Records | Task Records | Qualifying Weeks | Baseline Weeks | Qualifying Mean ($\mu_{\mathcal{Q}}$) | Baseline Mean ($\mu_{\mathcal{B}}$) | Observed Ratio ($R$) |
|---|---|---|---|---|---|---|---|
| **Maya** | 114 | 78 | 5 | 7 | ₹1,314.35 | ₹411.27 | **3.20×** |
| **Arjun** | 129 | 67 | 5 | 7 | ₹1,386.13 | ₹405.05 | **3.42×** |

- **Edge Case Robustness**:
  - Empty datasets: Engine returns `status: "insufficient_data"` with zero division or crash.
  - Baseline zero: Engine returns `status: "insufficient_data"` with `baseline_avg_zero` reason.
  - Insufficient sample sizes: Engine halts ratio calculation if qualifying or baseline weeks $< 3$.

---

## 11. Limitations & Ethical Considerations
- **Association vs Causation**: The system explicitly disclaims causal certainty. Overdue tasks and food deliveries may co-occur due to unobserved confounding variables (e.g. sickness, travel).
- **Manual Logging Burden**: Self-reported data introduces potential reporting attrition over extended time horizons.
- **Absence of Dark Patterns**: No algorithmic shaming, prescriptive moralizing, or commercial affiliate links.

---

## 12. Conclusion & Future Work
- **Summary**: Life, Decoded demonstrates that personal financial informatics can move beyond passive balance tracking toward explainable behavioral hypothesis generation.
- **Future Directions**:
  - Natural language explanation generation with local LLMs.
  - Longitudinal multi-cohort human evaluations.
  - Multi-dimensional correlation engine (sleep duration, exercise, travel).

---

## 13. References
1. Baumeister, R. F., Bratslavsky, E., Muraven, M., & Tice, D. M. (1998). Ego depletion: Is the active self a limited resource? *Journal of Personality and Social Psychology*, 74(5), 1252–1265.
2. Epstein, D. A., Ping, A., Fogarty, J., & Munson, S. A. (2015). A lived informatics model of personal informatics. In *Proceedings of the 2015 ACM International Joint Conference on Pervasive and Ubiquitous Computing* (pp. 731–742).
3. Kahneman, D. (2011). *Thinking, Fast and Slow*. Farrar, Straus and Giroux.
4. Kulesza, T., Burnett, M., Wong, W. K., & Stumpf, S. (2015). Principles of explanatory debugging to personalize interactive machine learning. In *Proceedings of the 20th International Conference on Intelligent User Interfaces* (pp. 126–137).
5. Li, I., Dey, A., & Forlizzi, J. (2010). A stage-based model of personal informatics systems. In *Proceedings of the SIGCHI Conference on Human Factors in Computing Systems* (pp. 557–566).
6. Miller, T. (2019). Explanation in artificial intelligence: Insights from the social sciences. *Artificial Intelligence*, 267, 1–38.

