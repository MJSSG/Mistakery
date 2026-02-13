from playwright.sync_api import sync_playwright

def main() -> None:
    console_messages = []
    page_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on(
            "console",
            lambda msg: console_messages.append(f"{msg.type}: {msg.text}"),
        )
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        page.goto("http://localhost:5173", wait_until="networkidle")
        page.wait_for_timeout(1000)

        title = page.title()
        h1_texts = page.locator("h1").all_text_contents()
        button_texts = page.locator("button").all_text_contents()
        input_placeholders = page.locator("input").evaluate_all(
            "els => els.map(e => e.getAttribute('placeholder')).filter(Boolean)"
        )

        page.screenshot(path="temp/ui-check.png", full_page=True)
        browser.close()

    print("title:", title)
    print("h1:", h1_texts[:5])
    print("buttons:", button_texts[:10])
    print("input_placeholders:", input_placeholders[:10])
    print("console_messages:", console_messages[:10])
    print("page_errors:", page_errors[:10])


if __name__ == "__main__":
    main()
