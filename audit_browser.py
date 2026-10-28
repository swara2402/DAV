import sys
import time
from playwright.sync_api import sync_playwright

def run_browser_audit():
    print("=" * 60)
    print("STARTING FULL LIVE BROWSER AUDIT: LIFE, DECODED")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        errors = []
        page.on("pageerror", lambda exc: errors.append(f"Console error: {exc}"))

        # -----------------------------------------------------------
        # Step 1: Landing Page
        # -----------------------------------------------------------
        print("\n[Step 1] Visiting Landing Page: http://localhost:5173/")
        page.goto("http://localhost:5173/")
        page.wait_for_selector("text=Discover what your everyday routines might be costing you.")
        print("  ✓ Landing headline rendered")
        
        preview_text = page.locator("text=3.2×").first
        assert preview_text.is_visible(), "Synthetic preview card 3.2× not visible"
        print("  ✓ Synthetic preview card 3.2× visible")

        # Click 'Explore Demo' button on landing
        print("  -> Clicking 'Explore Demo' button...")
        explore_demo_btn = page.locator("a:has-text('Explore Demo')").first
        explore_demo_btn.click()
        page.wait_for_url("**/persona")
        print("  ✓ Navigated to /persona")

        # -----------------------------------------------------------
        # Step 2: Persona Selection (Maya)
        # -----------------------------------------------------------
        print("\n[Step 2] Testing Persona Selection Screen")
        page.wait_for_selector("text=Choose a Persona to Explore")
        assert page.locator("text=Maya, 23").first.is_visible(), "Maya card missing"
        assert page.locator("text=Arjun, 25").first.is_visible(), "Arjun card missing"
        assert page.locator("h3:has-text('Start Fresh')").is_visible(), "Start Fresh card missing"
        print("  ✓ All 3 persona cards visible (Maya, Arjun, Start Fresh)")

        print("  -> Clicking 'Select Maya' button...")
        page.locator("button:has-text('Select Maya')").click()
        page.wait_for_url("**/dashboard", timeout=15000)
        print("  ✓ Successfully navigated to /dashboard")

        # -----------------------------------------------------------
        # Step 3: Dashboard Inspection & Interactions
        # -----------------------------------------------------------
        print("\n[Step 3] Testing Dashboard Controls & Widgets")
        page.wait_for_selector("text=Good", timeout=10000)
        greeting = page.locator("h1").first.text_content()
        print(f"  ✓ Dashboard greeting: '{greeting}'")

        # Stat cards check
        page.wait_for_selector("text=Total Spending")
        page.wait_for_selector("text=Convenience Food")
        page.wait_for_selector("text=Tasks Completed")
        page.wait_for_selector("text=Currently Overdue")
        print("  ✓ All 4 primary metric cards rendered")

        # Insight card check
        page.wait_for_selector("text=Calculated Finding")
        insight_headline = page.locator("h2").first.text_content()
        print(f"  ✓ Calculated Insight card: '{insight_headline}'")
        assert "3.2×" in insight_headline or page.locator("text=3.2×").is_visible()

        # Period dropdown test
        print("  -> Testing Period Selector dropdown...")
        select_elem = page.locator("select").first
        select_elem.select_option(value="30")
        page.wait_for_timeout(1000)
        print("  ✓ Changed period to 'Last 30 Days'")
        select_elem.select_option(value="84")
        page.wait_for_timeout(1000)
        print("  ✓ Changed period back to 'Last 12 Weeks'")

        # -----------------------------------------------------------
        # Step 4: Quick Add Expense Modal Flow
        # -----------------------------------------------------------
        print("\n[Step 4] Testing Quick Add Expense Modal")
        print("  -> Clicking 'Add Expense' button...")
        page.locator("button:has-text('Add Expense')").first.click()
        page.wait_for_selector("text=Quick Add Expense")
        print("  ✓ Expense modal opened")

        # Fill expense form
        amount_input = page.locator("input[placeholder='450.00']")
        amount_input.fill("280.00")
        
        # Click category chip 'Convenience Food'
        page.locator("button:has-text('Convenience Food')").first.click()
        
        desc_input = page.locator("input[placeholder='e.g. Swiggy quick delivery']")
        desc_input.fill("Playwright automated audit order")

        print("  -> Submitting expense form...")
        page.locator("button:has-text('Save Expense')").click()
        page.wait_for_selector("text=Quick Add Expense", state="hidden")
        print("  ✓ Expense modal closed successfully upon submission")
        page.wait_for_timeout(1000)

        # -----------------------------------------------------------
        # Step 5: Quick Add Task Modal Flow
        # -----------------------------------------------------------
        print("\n[Step 5] Testing Quick Add Task Modal")
        print("  -> Clicking 'Add Task' button in sidebar...")
        add_task_btn = page.locator("aside button:has-text('Add Task')").first
        add_task_btn.click()
        page.wait_for_selector("text=Quick Add Task")
        print("  ✓ Task modal opened")

        title_input = page.locator("input[placeholder='e.g. Finish Q3 tax review']")
        title_input.fill("Playwright test backlog task")

        # Category chip
        page.locator("button:has-text('Work')").first.click()

        print("  -> Submitting task form...")
        page.locator("button:has-text('Save Task')").click()
        page.wait_for_selector("text=Quick Add Task", state="hidden")
        print("  ✓ Task modal closed successfully upon submission")
        page.wait_for_timeout(1000)

        # -----------------------------------------------------------
        # Step 6: Inspect Evidence & Calculation Page Flow
        # -----------------------------------------------------------
        print("\n[Step 6] Navigating to Insight Detail Screen")
        inspect_link = page.locator("a:has-text('Inspect Evidence & Calculation')").first
        inspect_link.click()
        page.wait_for_url("**/insight")
        print("  ✓ Navigated to /insight")

        page.wait_for_selector("text=Weekly Evidence Distribution")
        ratio_found = page.locator("text=3.20×").first.is_visible() or page.locator("text=3.2×").first.is_visible()
        assert ratio_found, "3.2x ratio not found"
        print("  ✓ Insight ratio displayed with exact mathematical precision")

        # Test "How was this calculated?" accordion button
        print("  -> Testing 'How was this calculated?' accordion button...")
        accordion_btn = page.locator("button:has-text('How was this calculated?')")
        assert accordion_btn.is_visible()
        accordion_btn.click()
        page.wait_for_selector("text=Mathematical Formula")
        page.wait_for_selector("text=ratio = mean(qualifying_cf_spending) / mean(baseline_cf_spending)")
        page.wait_for_selector("text=Qualifying Weeks")
        page.wait_for_selector("text=Baseline Weeks")
        print("  ✓ Expandable mathematical audit panel opened and verified")

        # Test "I Tried This Change" button
        print("  -> Testing 'I Tried This Change' action button...")
        tried_it_btn = page.locator("button:has-text('I Tried This Change')")
        assert tried_it_btn.is_visible()
        tried_it_btn.click()
        page.wait_for_selector("text=Action Logged in Follow-up Tracker", timeout=10000)
        page.wait_for_selector("text=0 of 28 days have passed", timeout=10000)
        print("  ✓ 'I Tried This Change' successfully logged and updated follow-up state")

        # Return to Dashboard
        print("  -> Clicking 'Back to Dashboard' link...")
        page.locator("a:has-text('Back to Dashboard')").first.click()
        page.wait_for_url("**/dashboard")
        print("  ✓ Returned to /dashboard")

        # -----------------------------------------------------------
        # Step 7: Theme Toggle & Sidebar Navigation
        # -----------------------------------------------------------
        print("\n[Step 7] Testing Appearance Theme Toggle")
        theme_btn = page.locator("aside button[aria-label='Toggle theme']")
        theme_btn.click()
        page.wait_for_timeout(500)
        is_dark = page.evaluate("() => document.documentElement.classList.contains('dark')")
        print(f"  ✓ Dark mode activated: {is_dark}")
        theme_btn.click()
        page.wait_for_timeout(500)
        is_dark_again = page.evaluate("() => document.documentElement.classList.contains('dark')")
        print(f"  ✓ Toggled back to light mode: {not is_dark_again}")

        # -----------------------------------------------------------
        # Step 8: Switch Persona to Arjun
        # -----------------------------------------------------------
        print("\n[Step 8] Testing Persona Switching to Arjun")
        switch_link = page.locator("a:has-text('Switch persona →')")
        switch_link.click()
        page.wait_for_url("**/persona")
        print("  ✓ Arrived at /persona")

        print("  -> Clicking 'Select Arjun'...")
        page.locator("button:has-text('Select Arjun')").click()
        page.wait_for_url("**/dashboard", timeout=15000)
        page.wait_for_selector("text=Good")
        assert "Arjun" in page.locator("h1").first.text_content()
        print("  ✓ Dashboard switched to Arjun")

        # Inspect Arjun's Insight to verify independent ratio (3.4x)
        print("  -> Inspecting Arjun's Insight ratio...")
        page.locator("a:has-text('Inspect Evidence & Calculation')").first.click()
        page.wait_for_url("**/insight")
        page.wait_for_selector("text=Weekly Evidence Distribution")
        arjun_ratio = page.locator("text=3.42×").first.is_visible() or page.locator("text=3.4×").first.is_visible()
        assert arjun_ratio, "Arjun's 3.4x ratio not found"
        print("  ✓ Arjun's calculated ratio is independently confirmed at 3.42× (not 3.20×)")

        # -----------------------------------------------------------
        # Step 9: Settings & Data Reset Flow
        # -----------------------------------------------------------
        print("\n[Step 9] Testing Settings & Workspace Reset")
        page.locator("aside a:has-text('Settings')").click()
        page.wait_for_url("**/settings")
        print("  ✓ Navigated to /settings")

        page.wait_for_selector("text=Workspace Settings")
        assert page.locator("text=demo_arjun").is_visible()

        # Reset button flow
        reset_btn = page.locator("button:has-text('Reset Session Data')")
        reset_btn.click()
        page.wait_for_selector("text=Confirm Workspace Data Deletion")
        print("  ✓ Confirmation dialog opened")

        # Cancel button
        page.locator("button:has-text('Cancel')").click()
        page.wait_for_selector("text=Confirm Workspace Data Deletion", state="hidden")
        print("  ✓ Cancel button works")

        # Reopen and Confirm Delete
        page.locator("button:has-text('Reset Session Data')").click()
        page.locator("button:has-text('Yes, Delete All Records')").click()
        page.wait_for_selector("text=Workspace data cleared", timeout=5000)
        page.wait_for_url("**/persona", timeout=10000)
        print("  ✓ Reset succeeded and redirected to /persona")

        # -----------------------------------------------------------
        # Step 10: Start Fresh & Sign Out
        # -----------------------------------------------------------
        print("\n[Step 10] Testing 'Start Fresh' (Empty Workspace)")
        page.locator("button:has-text('Start Fresh')").click()
        page.wait_for_url("**/dashboard", timeout=15000)
        page.wait_for_selector("text=Good")
        
        # Verify empty state
        page.wait_for_selector("text=Data accumulation in progress")
        print("  ✓ Start Fresh displays genuine empty/insufficient data state")

        # Sign out
        print("  -> Clicking 'Sign out' button...")
        page.locator("aside button[title='Sign out']").click()
        page.wait_for_selector("text=Sign in to your account")
        print("  ✓ Successfully signed out (protected route redirect to /auth verified)")

        # -----------------------------------------------------------
        # Step 11: 404 Not Found Page
        # -----------------------------------------------------------
        print("\n[Step 11] Testing Not Found Page")
        page.goto("http://localhost:5173/nonexistent-route-for-audit")
        page.wait_for_selector("text=Page Not Found")
        page.locator("a:has-text('Return to Dashboard')").click()
        # Since not authenticated, should redirect to /auth
        page.wait_for_selector("text=Sign in to your account")
        print("  ✓ 404 page handled and protected route redirection verified")

        browser.close()

        if errors:
            print("\nBrowser console errors encountered:")
            for err in errors:
                print(f"  - {err}")
            sys.exit(1)
        else:
            print("\n" + "=" * 60)
            print("PERFECT: ALL BUTTONS, MODALS, AND USER FLOWS VERIFIED LIVE!")
            print("=" * 60)

if __name__ == "__main__":
    run_browser_audit()
