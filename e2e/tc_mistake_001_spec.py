"""
TC-MISTAKE-001: 智能解析错题录入测试
根据 docs/FUNCTIONAL_TESTING_DOCUMENTATION.md 中的测试用例
遵循 docs/PLAYWRIGHT_TESTING_GUIDE.md 的测试规范
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright, expect
import json
from datetime import datetime

# 测试数据
TEST_QUESTION = """资本主义的基本矛盾是什么？
A. 生产和消费的矛盾
B. 无产阶级和资产阶级的矛盾
C. 私人劳动和社会劳动的矛盾
D. 生产社会化和生产资料资本主义私人占有之间的矛盾

我的答案：A
正确答案：D
解析：资本主义的基本矛盾是生产社会化和生产资料资本主义私人占有之间的矛盾。"""

class TCMistake001:
    """TC-MISTAKE-001 智能解析测试类"""

    def __init__(self, page):
        self.page = page
        self.selectors = {
            # 登录页选择器
            'username_input': 'input[type="text"]',
            'password_input': 'input[type="password"]',
            'login_button': 'button:has-text("登录")',

            # 错题录入页选择器（使用更精确的选择器）
            'content_textarea': 'textarea.el-textarea__inner[rows="12"]',
            'paste_button': 'button:has-text("粘贴")',
            'correct_answer_input': 'input.el-input__inner[placeholder*="正确答案"]',
            'user_answer_input': 'input.el-input__inner[placeholder*="错误答案"]',
            'analysis_textarea': 'textarea.el-textarea__inner[rows="4"]',

            # 题型选择
            'type_radio_single': 'input[value="choice"]',
            'type_radio_multi': 'input[value="choice-multi"]',
            'type_radio_fill': 'input[value="fill"]',
            'type_radio_judge': 'input[value="judge"]',

            # 预览面板
            'preview_panel': '.preview-panel, .entry-sidebar',
            'confirm_button': 'button:has-text("确认")',
            'save_button': 'button:has-text("保存")',
        }
        self.test_results = []

    def log(self, message: str, level: str = 'INFO'):
        """记录测试日志"""
        timestamp = datetime.now().strftime('%H:%M:%S')
        print(f"[{timestamp}] [{level}] {message}")
        self.test_results.append({
            'timestamp': timestamp,
            'level': level,
            'message': message
        })

    def login(self, username: str, password: str) -> bool:
        """执行登录"""
        self.log("步骤 1: 导航到登录页", "INFO")
        self.page.goto('http://localhost:5173/login')
        self.page.wait_for_load_state('networkidle')

        self.log("步骤 2: 填写登录表单", "INFO")
        self.page.fill(self.selectors['username_input'], username)
        self.page.fill(self.selectors['password_input'], password)

        self.log("步骤 3: 点击登录按钮", "INFO")
        self.page.click(self.selectors['login_button'])

        try:
            self.page.wait_for_url('**/', timeout=5000)
            self.log("登录成功", "SUCCESS")
            return True
        except:
            self.log("登录失败或超时", "ERROR")
            return False

    def navigate_to_entry_page(self) -> bool:
        """导航到错题录入页"""
        self.log("步骤 4: 导航到错题录入页", "INFO")
        self.page.goto('http://localhost:5173/mistake/entry')
        self.page.wait_for_load_state('networkidle')

        # 验证页面加载成功
        try:
            self.page.wait_for_selector(self.selectors['content_textarea'], timeout=5000)
            self.log("错题录入页加载成功", "SUCCESS")
            return True
        except:
            self.log("错题录入页加载失败", "ERROR")
            return False

    def test_smart_parsing(self) -> dict:
        """执行智能解析测试"""
        self.log("=" * 60, "INFO")
        self.log("开始执行 TC-MISTAKE-001: 智能解析测试", "INFO")
        self.log("=" * 60, "INFO")

        # 截图：初始状态
        self.page.screenshot(path='screenshots/tc-mistake-001-01-initial.png', full_page=True)
        self.log("已保存初始状态截图", "INFO")

        # 步骤 5: 粘贴题目内容
        self.log("步骤 5: 粘贴题目内容", "INFO")
        content_textarea = self.page.locator(self.selectors['content_textarea'])
        content_textarea.fill(TEST_QUESTION)
        self.log("已粘贴题目内容", "SUCCESS")

        # 等待自动解析完成（QuestionEditor 的 parseContent 会自动触发）
        self.page.wait_for_timeout(2000)

        # 截图：解析后
        self.page.screenshot(path='screenshots/tc-mistake-001-02-after-paste.png', full_page=True)
        self.log("已保存解析后截图", "INFO")

        # 验证结果
        results = {
            'test_name': 'TC-MISTAKE-001: 智能解析',
            'passed': [],
            'failed': [],
            'details': {}
        }

        # 检查 1: 验证题型识别
        self.log("\\n检查 1: 验证题型识别", "INFO")
        try:
            # 检查题型是否被识别为单选题
            type_checked = self.page.locator(self.selectors['type_radio_single']).is_checked()
            if type_checked:
                self.log("✓ 题型识别正确: 单选题", "SUCCESS")
                results['passed'].append('题型识别为单选题')
                results['details']['question_type'] = 'single (单选)'
            else:
                self.log("✗ 题型识别错误: 不是单选题", "ERROR")
                results['failed'].append('题型识别错误')
                results['details']['question_type'] = 'unknown'
        except Exception as e:
            self.log(f"✗ 题型检查失败: {str(e)}", "ERROR")
            results['failed'].append(f'题型检查失败: {str(e)}')

        # 检查 2: 验证正确答案提取
        self.log("\\n检查 2: 验证正确答案提取", "INFO")
        try:
            correct_answer = self.page.locator(self.selectors['correct_answer_input']).input_value()
            if correct_answer == 'D':
                self.log(f"✓ 正确答案提取正确: {correct_answer}", "SUCCESS")
                results['passed'].append('正确答案提取正确')
                results['details']['correct_answer'] = correct_answer
            else:
                self.log(f"✗ 正确答案提取错误: 期望 'D'，实际 '{correct_answer}'", "ERROR")
                results['failed'].append(f'正确答案错误: {correct_answer}')
                results['details']['correct_answer'] = correct_answer
        except Exception as e:
            self.log(f"✗ 正确答案检查失败: {str(e)}", "ERROR")
            results['failed'].append(f'正确答案检查失败: {str(e)}')

        # 检查 3: 验证用户答案提取
        self.log("\\n检查 3: 验证用户答案提取", "INFO")
        try:
            user_answer = self.page.locator(self.selectors['user_answer_input']).input_value()
            if user_answer == 'A':
                self.log(f"✓ 用户答案提取正确: {user_answer}", "SUCCESS")
                results['passed'].append('用户答案提取正确')
                results['details']['user_answer'] = user_answer
            else:
                self.log(f"✗ 用户答案提取错误: 期望 'A'，实际 '{user_answer}'", "ERROR")
                results['failed'].append(f'用户答案错误: {user_answer}')
                results['details']['user_answer'] = user_answer
        except Exception as e:
            self.log(f"✗ 用户答案检查失败: {str(e)}", "ERROR")
            results['failed'].append(f'用户答案检查失败: {str(e)}')

        # 检查 4: 验证解析内容提取
        self.log("\\n检查 4: 验证解析内容提取", "INFO")
        try:
            analysis = self.page.locator(self.selectors['analysis_textarea']).input_value()
            if '资本主义的基本矛盾' in analysis:
                self.log(f"✓ 解析内容提取正确: 包含关键词", "SUCCESS")
                results['passed'].append('解析内容提取正确')
                results['details']['analysis'] = '包含关键词'
            else:
                self.log(f"✗ 解析内容提取错误或为空", "ERROR")
                results['failed'].append('解析内容提取错误')
                results['details']['analysis'] = analysis[:50] if analysis else 'empty'
        except Exception as e:
            self.log(f"✗ 解析内容检查失败: {str(e)}", "ERROR")
            results['failed'].append(f'解析内容检查失败: {str(e)}')

        # 检查 5: 验证预览面板
        self.log("\\n检查 5: 验证预览面板显示", "INFO")
        try:
            preview_panel = self.page.locator(self.selectors['preview_panel'])
            if preview_panel.count() > 0:
                preview_text = preview_panel.inner_text()
                self.log(f"✓ 预览面板存在", "SUCCESS")
                results['passed'].append('预览面板显示')
                results['details']['preview_panel'] = 'visible'

                # 检查预览是否包含关键信息
                if '资本主义' in preview_text:
                    self.log("  ✓ 预览包含题目内容", "SUCCESS")
                else:
                    self.log("  ✗ 预览未包含题目内容", "ERROR")

                if 'D' in preview_text:
                    self.log("  ✓ 预览包含答案信息", "SUCCESS")
                else:
                    self.log("  ✗ 预览未包含答案信息", "ERROR")
            else:
                self.log(f"✗ 预览面板不存在", "ERROR")
                results['failed'].append('预览面板未显示')
                results['details']['preview_panel'] = 'not visible'
        except Exception as e:
            self.log(f"✗ 预览面板检查失败: {str(e)}", "ERROR")
            results['failed'].append(f'预览面板检查失败: {str(e)}')

        # 检查 6: 验证控制台无错误
        self.log("\\n检查 6: 验证控制台日志", "INFO")
        console_errors = []
        def handle_console(msg):
            if msg.type == 'error':
                console_errors.append(msg.text)

        self.page.on('console', handle_console)
        self.page.wait_for_timeout(1000)  # 等待收集控制台消息

        if len(console_errors) == 0:
            self.log("✓ 控制台无错误", "SUCCESS")
            results['passed'].append('控制台无错误')
            results['details']['console_errors'] = 0
        else:
            self.log(f"✗ 控制台发现 {len(console_errors)} 个错误", "ERROR")
            for err in console_errors[:3]:
                self.log(f"  - {err}", "ERROR")
            results['failed'].append(f'控制台有错误: {len(console_errors)}个')
            results['details']['console_errors'] = len(console_errors)

        return results

    def generate_report(self, results: dict):
        """生成测试报告"""
        self.log("\\n" + "=" * 60, "INFO")
        self.log("测试报告", "INFO")
        self.log("=" * 60, "INFO")

        passed_count = len(results['passed'])
        failed_count = len(results['failed'])
        total_count = passed_count + failed_count

        print(f"\\n测试用例: {results['test_name']}")
        print(f"执行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"\\n测试结果:")
        print(f"  总计: {total_count}")
        print(f"  通过: {passed_count}")
        print(f"  失败: {failed_count}")
        print(f"  通过率: {passed_count/total_count*100:.1f}%" if total_count > 0 else "  通过率: N/A")

        if results['passed']:
            print(f"\\n✓ 通过项:")
            for item in results['passed']:
                print(f"  - {item}")

        if results['failed']:
            print(f"\\n✗ 失败项:")
            for item in results['failed']:
                print(f"  - {item}")

        print(f"\\n详细信息:")
        for key, value in results['details'].items():
            print(f"  {key}: {value}")

        # 保存测试报告
        report_path = 'screenshots/tc-mistake-001-report.json'
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"\\n测试报告已保存: {report_path}")

        return failed_count == 0


def main():
    """主测试函数"""
    import os
    os.makedirs('screenshots', exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        # 监听网络请求
        api_requests = []
        def handle_request(request):
            if '/api/' in request.url:
                api_requests.append({
                    'method': request.method,
                    'url': request.url,
                    'timestamp': datetime.now().isoformat()
                })
        page.on('request', handle_request)

        # 监听响应
        api_responses = []
        def handle_response(response):
            if '/api/' in response.url:
                api_responses.append({
                    'url': response.url,
                    'status': response.status,
                    'timestamp': datetime.now().isoformat()
                })
        page.on('response', handle_response)

        test = TCMistake001(page)

        try:
            # 登录
            if not test.login('test_user', 'Test123456'):
                test.log("登录失败，终止测试", "ERROR")
                browser.close()
                return

            # 导航到错题录入页
            if not test.navigate_to_entry_page():
                test.log("导航失败，终止测试", "ERROR")
                browser.close()
                return

            # 执行智能解析测试
            results = test.test_smart_parsing()

            # 生成报告
            all_passed = test.generate_report(results)

            # 记录 API 请求
            test.log(f"\\nAPI 请求记录: {len(api_requests)} 个", "INFO")
            for req in api_requests:
                test.log(f"  {req['method']} {req['url']}", "INFO")

            test.log(f"\\nAPI 响应记录: {len(api_responses)} 个", "INFO")
            for resp in api_responses:
                status_icon = "✓" if resp['status'] < 400 else "✗"
                test.log(f"  {status_icon} {resp['url']} - {resp['status']}", "INFO")

            # 保持浏览器打开一段时间
            test.log("\\n浏览器将在 10 秒后关闭...", "INFO")
            page.wait_for_timeout(10000)

        except Exception as e:
            test.log(f"测试执行异常: {str(e)}", "ERROR")
            import traceback
            traceback.print_exc()
        finally:
            browser.close()
            test.log("测试完成", "INFO")


if __name__ == '__main__':
    main()
