from playwright.sync_api import sync_playwright


def main() -> None:
    console_messages = []
    page_errors = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_default_timeout(8000)

            page.on("console", lambda msg: console_messages.append(f"{msg.type}: {msg.text}"))
            page.on("pageerror", lambda err: page_errors.append(str(err)))

            print("step: open login", flush=True)
            page.goto("http://localhost:5173/login", wait_until="networkidle")
            page.get_by_placeholder("请输入用户名或邮箱").fill("1234")
            page.get_by_placeholder("请输入密码").fill("123456")
            page.get_by_role("button", name="登录").click()
            page.wait_for_load_state("networkidle")

            login_message = None
            try:
                page.locator(".el-message").first.wait_for(timeout=4000)
                login_message = page.locator(".el-message").first.inner_text()
            except Exception:
                login_message = None

            token = page.evaluate("localStorage.getItem('mistakery_token')")
            print("login message:", login_message, flush=True)
            print("token present:", bool(token), flush=True)

            print("step: open practice setup", flush=True)
            page.goto("http://localhost:5173/practice/setup", wait_until="networkidle")
            print("current url:", page.url, flush=True)

            print("step: select subject", flush=True)
            page.locator(".category-item").first.wait_for()
            page.locator(".category-item", has_text="言语理解").first.click()
            page.wait_for_timeout(800)
            print("knowledge point widget count:", page.locator(".knowledge-point-tree").count(), flush=True)
            try:
                widget_html = page.locator(".knowledge-point-tree").evaluate("el => el.outerHTML")
                print("knowledge point widget html:", widget_html[:300], flush=True)
            except Exception:
                print("knowledge point widget html: <unavailable>", flush=True)

            print("step: select knowledge point", flush=True)
            page.locator(".knowledge-point-tree .el-select__wrapper").click(force=True)
            page.wait_for_timeout(1000)
            popper = page.locator(".el-tree-select__popper")
            print("popper count:", popper.count(), flush=True)
            try:
                print("popper visible:", popper.first.is_visible(), flush=True)
            except Exception:
                print("popper visible: <unavailable>", flush=True)
            try:
                popper_text = popper.first.inner_text()
                print("popper text:", popper_text[:200], flush=True)
            except Exception:
                print("popper text: <unavailable>", flush=True)
            labels_locator = page.locator(".el-tree-select__popper")
            labels_text = labels_locator.first.inner_text()
            print("knowledge labels:", labels_text.replace("\r", "").split("\n"), flush=True)
            logic_label = page.locator(".el-tree-select__popper").get_by_text("逻辑填空", exact=True)
            if logic_label.count() == 0:
                raise RuntimeError("knowledge point not found: 逻辑填空")
            logic_label.first.click()
            page.keyboard.press("Escape")

            print("step: select filters", flush=True)
            print("step: filter type", flush=True)
            page.locator(".filter-group", has_text="题型").locator(".el-select").click()
            page.get_by_role("option", name="单选题").click()

            print("step: filter difficulty", flush=True)
            page.locator(".filter-group", has_text="难度").locator(".el-select").click()
            page.get_by_role("option", name="中等").click()

            print("step: filter mastery", flush=True)
            page.locator(".filter-group", has_text="掌握程度").locator(".el-select").click()
            page.get_by_role("option", name="未掌握").click()

            available_hint = None
            preset_20_present = False

            print("step: fill name", flush=True)
            page.get_by_placeholder("为本次练习命名，方便后续查看").fill("言语理解-逻辑填空-单选-中等-未掌握-20题")

            print("step: generate", flush=True)
            generate_button = page.get_by_role("button", name="生成练习")
            try:
                print("generate disabled:", generate_button.is_disabled(), flush=True)
            except Exception:
                print("generate disabled: <unavailable>", flush=True)
            generate_button.click()

            page.wait_for_timeout(2000)
            message = None
            try:
                messages = page.locator(".el-message").all_text_contents()
                message = messages[0] if messages else None
            except Exception:
                message = None
            current_url = page.url

            page.screenshot(path="temp/practice-flow.png", full_page=True)
            browser.close()

        result_lines = [
            f"url: {current_url}",
            f"available_hint: {available_hint}",
            f"preset_20_present: {preset_20_present}",
            f"message: {message}",
            f"console_messages: {console_messages[:10]}",
            f"page_errors: {page_errors[:10]}",
        ]
        with open("temp/practice_flow_result.txt", "w", encoding="utf-8") as handle:
            handle.write("\n".join(result_lines))
        for line in result_lines:
            print(line, flush=True)
    except Exception as exc:
        import traceback

        print("error:", type(exc).__name__, str(exc), flush=True)
        print(traceback.format_exc(), flush=True)


if __name__ == "__main__":
    main()
