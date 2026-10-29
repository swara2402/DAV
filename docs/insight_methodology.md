# Insight Engine Methodology & Mathematical Foundations

## 1. Central Insight Formulation

The Insight Engine in **Life, Decoded** evaluates the empirical relationship between workload overload and convenience food spending:

$$\text{Headline: "During weeks with 3 or more overdue tasks, average convenience-food spending was } X \text{ times the baseline."}$$

> [!NOTE]
> This relationship is reported strictly as an **empirical association**, not proof of causal influence.

---

## 2. Definitions & Mathematical Formalism

### 2.1 Analysis Window
The observation period $W$ is defined as the $N = 12$ most recent **complete calendar weeks** prior to the current date. A week is deemed complete when its closing Sunday at 23:59:59 IST has elapsed.

$$\mathcal{W} = \{ w_1, w_2, \dots, w_{12} \}$$

Where each week $w_i = [m_i, s_i]$ starts on Monday $m_i$ at 00:00:00 IST and closes on Sunday $s_i$ at 23:59:59 IST.

### 2.2 Historical Overdue Snapshot Evaluation
For each week $w_i$, a historical snapshot $S_i$ is evaluated at Sunday closing ($s_i$).

A task $T$ with due date $d(T)$ and completion date $c(T)$ is defined as **overdue at snapshot $S_i$** if and only if:

$\text{Overdue}(T, S_i) \iff d(T) < s_i \land \left( c(T) \text{ is } \emptyset \lor c(T) > s_i \right)$

The total overdue count for week $w_i$ is:

$$O_i = \sum_{T \in \mathcal{T}} \mathbf{1}_{\{\text{Overdue}(T, S_i)\}}$$

### 2.3 Cohort Partitioning
The weeks in $\mathcal{W}$ are partitioned into two disjoint subsets based on the threshold $\theta = 3$:

1. **Qualifying Group** ($\mathcal{Q}$):
   $$\mathcal{Q} = \{ w_i \in \mathcal{W} \mid O_i \ge \theta \}$$
   $$N_{\mathcal{Q}} = |\mathcal{Q}|$$

2. **Baseline Group** ($\mathcal{B}$):
   $$\mathcal{B} = \{ w_i \in \mathcal{W} \mid O_i < \theta \}$$
   $$N_{\mathcal{B}} = |\mathcal{B}|$$

### 2.4 Weekly Convenience Food Spending
A week is treated as spending-observed only when at least one expense record of any category exists during that week. Weeks with no expense records are treated as **unobserved**, not as evidence of zero spending, and are excluded from the qualifying/baseline comparison. The engine requires at least `MIN_ANALYSIS_WEEKS` observed weeks. This is still only a proxy for logging completeness: a transaction log cannot prove that every purchase was recorded.

For an observed week $w_i$, convenience food spending $C_i$ is the aggregate sum of eligible transaction records:

$$C_i = \sum_{e \in \mathcal{E}_{w_i}, \text{category}(e) = \text{'convenience\_food'}} \text{amount}(e)$$

### 2.5 Cohort Means and Ratio
The arithmetic mean of convenience-food spending for qualifying weeks is:

$$\mu_{\mathcal{Q}} = \frac{1}{N_{\mathcal{Q}}} \sum_{w_i \in \mathcal{Q}} C_i$$

The arithmetic mean for baseline weeks is:

$$\mu_{\mathcal{B}} = \frac{1}{N_{\mathcal{B}}} \sum_{w_j \in \mathcal{B}} C_j$$

The **Observed Comparison Ratio** $R$ is calculated as:

$$R = \frac{\mu_{\mathcal{Q}}}{\mu_{\mathcal{B}}}$$

---

## 3. Evidence Requirements & Confidence Thresholds

To prevent false confidence, misleading statistics, or spurious division-by-zero artifacts, the engine strictly enforces the following statistical sufficiency criteria:

| Parameter | Required Value | Rationale |
|---|---|---|
| `MIN_ANALYSIS_WEEKS` | $\ge 8$ complete weeks | Ensures longitudinal history rather than immediate transient spikes. |
| `MIN_QUALIFYING_WEEKS` | $\ge 3$ complete weeks | Prevents single anomalous deadline weeks from defining the qualifying mean. |
| `MIN_BASELINE_WEEKS` | $\ge 3$ complete weeks | Ensures representative baseline spending without extreme bias. |
| Baseline Mean $\mu_{\mathcal{B}}$ | $> 0$ | Prevents division by zero or infinite ratios. |
| Finite Precision | $\text{is\_finite}(R)$ | Prevents `NaN` or `Inf` from appearing in the user interface. |

If any condition fails to hold, the engine halts calculation and returns:
- `status: "insufficient_data"`
- `ratio: null`
- A human-readable `insufficient_reason` explaining exactly which threshold was not reached.

---

## 4. Versioning & Governance

- **Engine Version**: `1.0.0`
- **Formula Version**: `v1.0`
- **Snapshot Timezone**: `Asia/Kolkata` (IST)



## 5. Interpretation and data coverage

- A week with no expense rows is not silently counted as a zero-spending week. It is marked unobserved and excluded from the comparison.
- A week with expense rows but no `convenience_food` rows contributes zero convenience-food spend. This is only a reasonable interpretation if the user's expense logging is sufficiently complete.
- Missing expense logs cannot be distinguished perfectly from truly zero spending without an explicit weekly check-in or completeness marker. The app should communicate this limitation.
- Confidence intervals describe each group's mean separately. The reported ratio is a descriptive comparison, not a causal effect and not a population-level estimate.
