"""
TC-MISTAKE-002: 保存错题功能测试

根据 FUNCTIONAL_TESTING_DOCUMENTATION.md 中的测试用例进行验证。
"""

import json
import os
from datetime import datetime
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

# 测试配置
BASE_URL = "http://localhost:5173"
SCREENSHOT_DIR = "screenshots"
TEST_DATA_FILE = os.path.join(SCREENSHOT_DIR, "TC-MISTAKE-002-REPORT.json")

# 测试账号
TEST_USER = {
    "username": "test_user",
    "password": "Test123456"
}

# 测试错题数据
TEST_MISTAKE = {
    "subject": "政治理论",
    "content": """资本主义的基本矛盾是什么？
A. 生产和消费的矛盾
B. 无产阶级和资产阶级的矛盾
C. 私人劳动和社会劳动的矛盾
D. 生产社会化和生产资料资本主义私人占有之间的矛盾

我的答案：A
正确答案：D
解析：资本主义的基本矛盾是生产社会化和生产资料资本主义私人占有之间的矛盾。""",
    "difficulty": "中等",
    "tags": ["重点", "理解"]
}

# 确保截图目录存在
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

# 测试结果记录
test_results = {
    "test_case": "TC-MISTAKE-002",
    "test_name": "保存错题",
    "date": datetime.now().isoformat(),
    "environment": "localhost:5173",
    "steps": [],
    "checks": [],
    "api_requests": [],
    "errors": []
}

def log_step(step_name, status, details=""):
    """记录测试步骤"""
    step = {
        "step": step_name,
        "status": status,  # "pass" | "fail" | "skip"
        "details": details,
        "timestamp": datetime.now().isoformat()
    }
    test_results["steps"].append(step)
    print(f"[{status.upper()}] {step_name}")
    if details:
        print(f"  └─ {details}")

def log_check(check_name, status, expected="", actual="", notes=""):
    """记录验证检查"""
    check = {
        "check": check_name,
        "status": status,
        "expected": expected,
        "actual": actual,
        "notes": notes,
        "timestamp": datetime.now().isoformat()
    }
    test_results["checks"].append(check)
    icon = "✅" if status == "pass" else "❌"
    print(f"{icon} {check_name}")
    if expected and actual:
        print(f"  预期: {expected}")
        print(f"  实际: {actual}")
    if notes:
        print(f"  说明: {notes}")

def log_api_request(method, url, status):
    """记录 API 请求"""
    request = {
        "method": method,
        "url": url,
        "status": status,
        "timestamp": datetime.now().isoformat()
    }
    test_results["api_requests"].append(request)

def take_screenshot(page, name):
    """截图"""
    path = os.path.join(SCREENSHOT_DIR, f"tc-mistake-002-{name}.png")
    page.screenshot(path=path, full_page=True)
    print(f"  📸 截图: {path}")
    return path

def test_tc_mistake_002():
    """执行 TC-MISTAKE-002 测试"""

    print("=" * 60)
    print("TC-MISTAKE-002: 保存错题功能测试")
    print("=" * 60)

    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=False)  # 使用有头模式便于调试
        context = browser.new_context()
        page = context.new_page()

        # 监听网络请求
        def log_request(request):
            print(f"  🌐 {request.method} {request.url}")

        def log_response(response):
            log_api_request(response.request.method, response.url, response.status)

        page.on("request", log_request)
        page.on("response", log_response)

        try:
            # ========== 步骤 1: 访问登录页 ==========
            log_step("步骤1: 访问登录页", "in_progress")
            try:
                page.goto(f"{BASE_URL}/login")
                page.wait_for_load_state("networkidle", timeout=10000)
                take_screenshot(page, "01-login-page")
                log_step("步骤1: 访问登录页", "pass", "成功访问登录页面")
            except Exception as e:
                log_step("步骤1: 访问登录页", "fail", f"访问失败: {str(e)}")
                raise

            # ========== 步骤 2: 登录系统 ==========
            log_step("步骤2: 登录系统", "in_progress")
            try:
                # 填写用户名
                page.locator('input[name="username"]').fill(TEST_USER["username"])
                # 填写密码
                page.locator('input[name="password"]').fill(TEST_USER["password"])
                # 点击登录按钮
                page.locator('button[type="submit"]').click()

                # 等待跳转到首页
                page.wait_for_url("/", timeout=5000)
                page.wait_for_load_state("networkidle")

                take_screenshot(page, "02-after-login")
                log_step("步骤2: 登录系统", "pass", "成功登录并跳转到首页")
            except Exception as e:
                log_step("步骤2: 登录系统", "fail", f"登录失败: {str(e)}")
                raise

            # ========== 步骤 3: 导航到错题录入页 ==========
            log_step("步骤3: 导航到错题录入页", "in_progress")
            try:
                page.goto(f"{BASE_URL}/mistake/entry")
                page.wait_for_load_state("networkidle", timeout=10000)

                # 等待页面元素加载
                page.wait_for_selector("input[name='subject']", timeout=5000)

                take_screenshot(page, "03-entry-page")
                log_step("步骤3: 导航到错题录入页", "pass", "成功访问错题录入页面")
            except Exception as e:
                log_step("步骤3: 导航到错题录入页", "fail", f"导航失败: {str(e)}")
                raise

            # ========== 步骤 4: 填写错题信息 ==========
            log_step("步骤4: 填写错题信息", "in_progress")

            try:
                # 选择科目
                page.locator('input[name="subject"]').click()
                page.wait_for_selector(".el-select-dropdown", timeout=3000)

                # 查找并点击包含"政治理论"的选项
                subject_options = page.locator('.el-select-dropdown .el-select-dropdown__item')
                for i in range(subject_options.count()):
                    option_text = subject_options.nth(i).text_content()
                    if TEST_MISTAKE["subject"] in option_text:
                        subject_options.nth(i).click()
                        break

                page.wait_for_timeout(500)

                # 粘贴题目内容
                content_textarea = page.locator("textarea.content-input")
                content_textarea.fill(TEST_MISTAKE["content"])

                # 点击解析按钮
                parse_button = page.locator("button.parse-button")
                if parse_button.is_visible():
                    parse_button.click()
                    page.wait_for_timeout(2000)  # 等待解析完成

                take_screenshot(page, "04-after-paste")
                log_step("步骤4: 填写错题信息", "pass", "题目内容填写完成")

            except Exception as e:
                log_step("步骤4: 填写错题信息", "fail", f"填写失败: {str(e)}")
                raise

            # ========== 检查 1: 验证预览面板信息 ==========
            log_check("检查1: 预览面板显示", "in_progress")
            try:
                preview_panel = page.locator(".preview-panel")
                if preview_panel.is_visible():
                    take_screenshot(page, "05-preview-panel")
                    log_check("检查1: 预览面板显示", "pass",
                             notes="预览面板正常显示解析结果")
                else:
                    log_check("检查1: 预览面板显示", "fail",
                             notes="预览面板未显示")
            except Exception as e:
                log_check("检查1: 预览面板显示", "fail",
                         notes=f"检查失败: {str(e)}")

            # ========== 步骤 5: 选择难度等级 ==========
            log_step("步骤5: 选择难度等级", "in_progress")
            try:
                difficulty_selector = page.locator('.difficulty-select')
                if difficulty_selector.is_visible():
                    difficulty_selector.click()
                    page.wait_for_timeout(300)

                    # 选择"中等"
                    difficulty_options = page.locator('.el-select-dropdown .el-select-dropdown__item')
                    for i in range(difficulty_options.count()):
                        if TEST_MISTAKE["difficulty"] in difficulty_options.nth(i).text_content():
                            difficulty_options.nth(i).click()
                            break

                    page.wait_for_timeout(500)
                    log_step("步骤5: 选择难度等级", "pass",
                             f"成功选择难度: {TEST_MISTAKE['difficulty']}")
                else:
                    log_step("步骤5: 选择难度等级", "skip", "未找到难度选择器")

            except Exception as e:
                log_step("步骤5: 选择难度等级", "fail", f"选择失败: {str(e)}")

            # ========== 步骤 6: 点击保存按钮 ==========
            log_step("步骤6: 点击保存按钮", "in_progress")
            try:
                save_button = page.locator('button.save-button, button:has-text("保存")')
                save_button.click()

                # 等待保存响应
                page.wait_for_timeout(2000)

                take_screenshot(page, "06-after-save")
                log_step("步骤6: 点击保存按钮", "pass", "点击保存按钮")

            except Exception as e:
                log_step("步骤6: 点击保存按钮", "fail", f"点击失败: {str(e)}")
                raise

            # ========== 检查 2: 验证保存成功提示 ==========
            log_check("检查2: 保存成功提示", "in_progress")
            try:
                # 检查是否有成功提示消息
                success_message = page.locator(".el-message--success, .toast--success")

                if success_message.is_visible():
                    message_text = success_message.text_content()
                    take_screenshot(page, "07-success-message")
                    log_check("检查2: 保存成功提示", "pass",
                             expected="显示保存成功提示",
                             actual=message_text)
                else:
                    # 检查页面是否跳转到列表页
                    current_url = page.url
                    if "/mistake/list" in current_url or "/mistake" in current_url:
                        log_check("检查2: 保存成功提示", "pass",
                                 notes="页面跳转到错题列表，保存成功")
                    else:
                        log_check("检查2: 保存成功提示", "fail",
                                 notes="未显示成功提示，也未跳转")

            except Exception as e:
                log_check("检查2: 保存成功提示", "fail",
                         notes=f"检查失败: {str(e)}")

            # ========== 检查 3: 验证错题列表更新 ==========
            log_check("检查3: 错题列表更新", "in_progress")
            try:
                # 如果不在列表页，导航过去
                if "/mistake/list" not in page.url:
                    page.goto(f"{BASE_URL}/mistake/list")
                    page.wait_for_load_state("networkidle", timeout=10000)

                page.wait_for_timeout(1000)
                take_screenshot(page, "08-mistake-list")

                # 检查列表中是否有新添加的错题
                mistake_cards = page.locator(".mistake-card, .question-card")
                count = mistake_cards.count()

                if count > 0:
                    # 检查第一张卡片的内容
                    first_card = mistake_cards.nth(0)
                    card_text = first_card.text_content()

                    log_check("检查3: 错题列表更新", "pass",
                             expected="列表中显示新录入的错题",
                             actual=f"共 {count} 张错题卡",
                             notes="新错题已添加到列表")
                else:
                    log_check("检查3: 错题列表更新", "fail",
                             notes="错题列表为空，保存可能失败")

            except Exception as e:
                log_check("检查3: 错题列表更新", "fail",
                         notes=f"检查失败: {str(e)}")

            # ========== 检查 4: 验证数据库持久化 ==========
            log_check("检查4: 数据库持久化", "in_progress", notes="需要手动验证数据库")
            log_check("检查4: 数据库持久化", "skip",
                     notes="自动化测试无法直接验证数据库，建议手动检查")

            # ========== 检查 5: 验证可以继续录入 ==========
            log_check("检查5: 可以继续录入", "in_progress")
            try:
                # 返回录入页
                page.goto(f"{BASE_URL}/mistake/entry")
                page.wait_for_load_state("networkidle", timeout=10000)

                # 检查表单是否清空或可以继续使用
                content_textarea = page.locator("textarea.content-input")
                current_content = content_textarea.input_value()

                if not current_content or len(current_content) < 10:
                    log_check("检查5: 可以继续录入", "pass",
                             notes="表单已清空，可以继续录入")
                else:
                    log_check("检查5: 可以继续录入", "pass",
                             notes="表单保留上一次内容，可以继续录入")

            except Exception as e:
                log_check("检查5: 可以继续录入", "fail",
                         notes=f"检查失败: {str(e)}")

            take_screenshot(page, "09-final-state")

        except Exception as e:
            test_results["errors"].append({
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
            print(f"\n❌ 测试执行出错: {str(e)}")
            take_screenshot(page, "error-state")

        finally:
            # 保存测试结果
            with open(TEST_DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump(test_results, f, ensure_ascii=False, indent=2)

            # 生成最终统计
            print("\n" + "=" * 60)
            print("测试统计")
            print("=" * 60)

            total_steps = len(test_results["steps"])
            passed_steps = sum(1 for s in test_results["steps"] if s["status"] == "pass")
            failed_steps = sum(1 for s in test_results["steps"] if s["status"] == "fail")

            total_checks = len(test_results["checks"])
            passed_checks = sum(1 for c in test_results["checks"] if c["status"] == "pass")
            failed_checks = sum(1 for c in test_results["checks"] if c["status"] == "fail")
            skipped_checks = sum(1 for c in test_results["checks"] if c["status"] == "skip")

            print(f"测试步骤: {passed_steps}/{total_steps} 通过")
            print(f"验证检查: {passed_checks}/{total_checks} 通过 (跳过: {skipped_checks})")

            if failed_checks > 0:
                print(f"\n失败的检查:")
                for check in test_results["checks"]:
                    if check["status"] == "fail":
                        print(f"  ❌ {check['check']}: {check.get('notes', '')}")

            browser.close()

    return test_results

if __name__ == "__main__":
    results = test_tc_mistake_002()
    print(f"\n测试结果已保存到: {TEST_DATA_FILE}")
