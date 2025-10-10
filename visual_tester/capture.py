from playwright.sync_api import sync_playwright, Page, expect

def verify_pages(page: Page):
    """
    This script verifies the UI changes on the main, docs, and dashboard pages.
    """
    # 1. Verify the main page (index.html)
    print("Navigating to the main page...")
    page.goto("http://localhost:9090")
    # Wait for the page to load and animations to settle
    page.wait_for_selector(".hero-stats", state="visible")
    # Check for the updated response time text
    expect(page.get_by_text("0.02ms")).to_be_visible()
    expect(page.get_by_text("(excluding the z.ai request time)")).to_be_visible()
    print("Taking screenshot of the main page...")
    page.screenshot(path="visual_tester/main_page.png")

    # 2. Verify the docs page
    print("Navigating to the docs page...")
    page.goto("http://localhost:9090/docs")
    # Wait for the main container to be visible
    page.wait_for_selector(".container", state="visible")
    print("Taking screenshot of the docs page...")
    page.screenshot(path="visual_tester/docs_page.png")

    # 3. Verify the dashboard page
    print("Navigating to the dashboard page...")
    page.goto("http://localhost:9090/dashboard")
    # Wait for the stats container to be visible
    page.wait_for_selector(".stats-container", state="visible")
    print("Taking screenshot of the dashboard page...")
    page.screenshot(path="visual_tester/dashboard_page.png")

    print("All pages verified and screenshots taken.")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_pages(page)
        browser.close()

if __name__ == "__main__":
    main()