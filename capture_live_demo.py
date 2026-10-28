import os
import sys
import time
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = "/Users/sam/Desktop/DAV/docs/screenshots"
ARTIFACTS_DIR = "/Users/sam/.gemini/antigravity/brain/46bca3dd-f8bb-4429-99b8-bf3a9934156b"

os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

def save_screenshot(page, name):
    local_path = os.path.join(SCREENSHOTS_DIR, f"{name}.png")
    art_path = os.path.join(ARTIFACTS_DIR, f"{name}.png")
    page.screenshot(path=local_path, full_page=False)
    page.screenshot(path=art_path, full_page=False)
    print(f"  📸 Captured screenshot: {name}.png")

def main():
    print("=" * 60)
    print("EXECUTING REAL LIVE DEMO RUN & SCREENSHOT CAPTURE")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 850},
            device_scale_factor=2 # Retina quality
        )
        page = context.new_page()

        # 1. Landing Page
        print("\n1. Landing Page")
        page.goto("http://localhost:5173/")
        page.wait_for_selector("text=Discover what your everyday routines might be costing you.")
        time.sleep(1)
        save_screenshot(page, "01_landing_page")

        # 2. Persona Selection
        print("\n2. Persona Selection")
        page.locator("a:has-text('Explore Demo')").first.click()
        page.wait_for_selector("text=Choose a Persona to Explore")
        time.sleep(1)
        save_screenshot(page, "02_persona_selection")

        # 3. Maya Dashboard
        print("\n3. Maya Dashboard")
        page.locator("button:has-text('Select Maya')").click()
        page.wait_for_url("**/dashboard")
        page.wait_for_selector("text=Total Spending")
        time.sleep(1.5) # allow charts to animate
        save_screenshot(page, "03_maya_dashboard")

        # 4. Add Expense Modal
        print("\n4. Quick Add Expense Modal")
        page.locator("button:has-text('Add Expense')").first.click()
        page.wait_for_selector("text=Quick Add Expense")
        time.sleep(0.5)
        save_screenshot(page, "04_expense_modal")
        page.locator("button:has-text('Cancel')").click()
        time.sleep(0.5)

        # 5. Add Task Modal
        print("\n5. Quick Add Task Modal")
        page.locator("aside button:has-text('Add Task')").first.click()
        page.wait_for_selector("text=Quick Add Task")
        time.sleep(0.5)
        save_screenshot(page, "05_task_modal")
        page.locator("button:has-text('Cancel')").click()
        time.sleep(0.5)

        # 6. Insight Detail Screen
        print("\n6. Insight Detail Screen")
        page.locator("a:has-text('Inspect Evidence & Calculation')").first.click()
        page.wait_for_url("**/insight")
        page.wait_for_selector("text=Weekly Evidence Distribution")
        time.sleep(1.5) # allow chart to animate
        save_screenshot(page, "06_insight_detail")

        # 7. Expanded Mathematical Calculation Panel
        print("\n7. Mathematical Transparency Calculation Panel")
        page.locator("button:has-text('How was this calculated?')").click()
        page.wait_for_selector("text=Mathematical Formula")
        time.sleep(0.5)
        save_screenshot(page, "07_calculation_panel_expanded")

        # 8. Dark Mode
        print("\n8. Appearance Dark Mode")
        page.locator("aside button[aria-label='Toggle theme']").click()
        time.sleep(0.5)
        save_screenshot(page, "08_dark_mode_insight")

        # 9. Arjun Dashboard
        print("\n9. Arjun Persona & Dashboard")
        page.locator("aside button[aria-label='Toggle theme']").click() # back to light
        page.locator("a:has-text('Switch persona →')").click()
        page.wait_for_url("**/persona")
        page.locator("button:has-text('Select Arjun')").click()
        page.wait_for_url("**/dashboard")
        page.wait_for_selector("text=Arjun")
        time.sleep(1.5)
        save_screenshot(page, "09_arjun_dashboard")

        # 10. Settings & Reset Modal
        print("\n10. Settings & Reset Modal")
        page.locator("aside a:has-text('Settings')").click()
        page.wait_for_url("**/settings")
        page.locator("button:has-text('Reset Session Data')").click()
        page.wait_for_selector("text=Confirm Workspace Data Deletion")
        time.sleep(0.5)
        save_screenshot(page, "10_settings_reset_confirm")

        browser.close()
        print("\n" + "=" * 60)
        print("ALL 10 SCREENSHOTS CAPTURED WITH RETINA QUALITY")
        print("=" * 60)

if __name__ == "__main__":
    main()

