import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:4205", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Enter a valid one-time admin preview token and submit to authenticate.
        frame = context.pages[-1]
        # Enter the valid one-time admin preview token
        elem = frame.locator('xpath=html/body/app-root/app-login/div/div/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('798665')
        

        # -> Submit the token and authenticate.
        frame = context.pages[-1]
        # Click the 'Belépés kóddal' button to submit the token and authenticate
        elem = frame.locator('xpath=html/body/app-root/app-login/div/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Attempt to reuse the same token for login again by navigating back to the login page and entering the same token.
        await page.goto('http://localhost:4205/login', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Navigate back to the login page and attempt to reuse the same token to verify it cannot be reused.
        await page.goto('http://localhost:4205/login', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Navigate back to the login page and attempt to reuse the same token to verify it cannot be reused.
        await page.goto('http://localhost:4205/login', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Navigate to the admin preview token login page to attempt reuse of the same token.
        frame = context.pages[-1]
        # Click the 'Tablókirály' link to navigate back to the login page or homepage where login is accessible
        elem = frame.locator('xpath=html/body/app-root/app-main-layout/app-navbar/nav/div[2]/div/div/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        await page.goto('http://localhost:4205/login', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Click the 'Kilépés' (Logout) button to log out and return to the login page to test token reuse.
        frame = context.pages[-1]
        # Click the 'Kilépés' (Logout) button to log out and return to the login page
        elem = frame.locator('xpath=html/body/app-root/app-main-layout/app-navbar/nav/div[2]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Enter the previously used token '798665' into the token input field and attempt to login again to verify token reuse is prevented.
        frame = context.pages[-1]
        # Enter the previously used one-time token '798665' into the token input field
        elem = frame.locator('xpath=html/body/app-root/app-login/div/div/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('798665')
        

        frame = context.pages[-1]
        # Click the 'Belépés kóddal' button to attempt login with the reused token
        elem = frame.locator('xpath=html/body/app-root/app-login/div/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Tablókirály').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Bejelentkezés kóddal').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Belépés kóddal').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Túl sok próbálkozás. Kérlek várj néhány percet.').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    