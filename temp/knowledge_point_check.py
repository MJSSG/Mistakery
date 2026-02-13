from playwright.sync_api import sync_playwright


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_default_timeout(8000)

        page.goto("http://localhost:5173/login", wait_until="networkidle")
        page.get_by_placeholder("请输入用户名或邮箱").fill("1234")
        page.get_by_placeholder("请输入密码").fill("123456")
        page.get_by_role("button", name="登录").click()
        page.wait_for_load_state("networkidle")

        page.goto("http://localhost:5173/practice/setup", wait_until="networkidle")
        page.locator(".category-item", has_text="言语理解").first.click()

        field = page.get_by_placeholder("选择知识点，不选则包含所有知识点")
        field.click(force=True)
        page.wait_for_timeout(800)

        popper_count = page.locator(".el-tree-select__popper").count()
        labels = page.locator(".el-tree-select__popper .el-tree-node__label").all_text_contents()

        print("popper_count:", popper_count)
        print("labels:", labels)

        page.screenshot(path="temp/knowledge-point.png", full_page=True)
        browser.close()


if __name__ == "__main__":
    main()
