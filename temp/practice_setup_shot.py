from playwright.sync_api import sync_playwright


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173/login", wait_until="networkidle")
        page.get_by_placeholder("请输入用户名或邮箱").fill("1234")
        page.get_by_placeholder("请输入密码").fill("123456")
        page.get_by_role("button", name="登录").click()
        page.wait_for_load_state("networkidle")
        page.goto("http://localhost:5173/practice/setup", wait_until="networkidle")
        page.screenshot(path="temp/practice-setup.png", full_page=True)
        browser.close()


if __name__ == "__main__":
    main()
