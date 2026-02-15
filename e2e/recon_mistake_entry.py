"""
TC-MISTAKE-001 智能解析侦察脚本
用于了解错题录入页面的 DOM 结构和选择器
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright
import json

def recon_mistake_entry():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # 监听控制台日志
        console_messages = []
        def handle_console(msg):
            console_messages.append({
                'type': msg.type,
                'text': msg.text
            })
        page.on('console', handle_console)

        # 监听网络请求
        api_requests = []
        def handle_request(request):
            if '/api/' in request.url:
                api_requests.append({
                    'method': request.method,
                    'url': request.url
                })
        page.on('request', handle_request)

        print("📍 步骤 1: 导航到登录页")
        page.goto('http://localhost:5173/login')
        page.wait_for_load_state('networkidle')
        page.screenshot(path='screenshots/01-login-page.png', full_page=True)
        print("✅ 登录页截图完成")

        print("\n📍 步骤 2: 执行登录")
        # 尝试查找登录表单元素
        login_selectors = {
            'username_input': ['input[name="username"]', 'input[type="text"]', '[placeholder*="用户"]', '[placeholder*="账号"]'],
            'password_input': ['input[name="password"]', 'input[type="password"]', '[placeholder*="密码"]'],
            'submit_button': ['button[type="submit"]', 'button:has-text("登录")', 'button:has-text("登 录")', '.login-button']
        }

        # 查找并填写登录表单
        for selector in login_selectors['username_input']:
            try:
                if page.locator(selector).count() > 0:
                    print(f"  ✓ 找到用户名输入框: {selector}")
                    page.locator(selector).fill('test_user')
                    break
            except:
                continue

        for selector in login_selectors['password_input']:
            try:
                if page.locator(selector).count() > 0:
                    print(f"  ✓ 找到密码输入框: {selector}")
                    page.locator(selector).fill('Test123456')
                    break
            except:
                continue

        for selector in login_selectors['submit_button']:
            try:
                if page.locator(selector).count() > 0:
                    print(f"  ✓ 找到登录按钮: {selector}")
                    page.locator(selector).click()
                    break
            except:
                continue

        # 等待登录完成
        try:
            page.wait_for_url('**/', timeout=5000)
            print("✅ 登录成功")
        except:
            print("⚠️ 登录可能未成功，继续尝试导航")

        print("\n📍 步骤 3: 导航到错题录入页")
        page.goto('http://localhost:5173/mistake/entry')
        page.wait_for_load_state('networkidle')
        page.screenshot(path='screenshots/02-mistake-entry-page.png', full_page=True)
        print("✅ 错题录入页截图完成")

        print("\n📍 步骤 4: 侦察页面元素")
        # 检查页面关键元素
        elements_to_find = {
            'subject_select': [
                'select[name="subject"]',
                '.subject-select',
                '[role="combobox"]',
                'el-select'
            ],
            'content_textarea': [
                'textarea[name="content"]',
                'textarea[placeholder*="题目"]',
                'textarea[placeholder*="内容"]',
                '.content-input',
                'textarea'
            ],
            'parse_button': [
                'button:has-text("解析")',
                'button:has-text("解 析")',
                '.parse-button',
                'button[type="button"]'
            ]
        }

        found_elements = {}
        for element_name, selectors in elements_to_find.items():
            for selector in selectors:
                try:
                    count = page.locator(selector).count()
                    if count > 0:
                        print(f"  ✓ 找到 {element_name}: {selector} (数量: {count})")
                        found_elements[element_name] = selector
                        # 获取元素属性
                        element = page.locator(selector).first
                        attributes = element.evaluate(
                            '''el => ({
                            tagName: el.tagName,
                            type: el.type || '',
                            name: el.name || '',
                            id: el.id || '',
                            className: el.className || '',
                            placeholder: el.placeholder || ''
                        })'''
                        )
                        print(f"    属性: {json.dumps(attributes, ensure_ascii=False)}")
                        break
                except Exception as e:
                    continue

            if element_name not in found_elements:
                print(f"  ✗ 未找到 {element_name}")

        print("\n📍 步骤 5: 获取页面 HTML 结构")
        # 获取主要表单区域的 HTML
        try:
            form_html = page.locator('form, .form, .entry-panel').first.inner_html()
            print("\n表单区域 HTML:")
            print(form_html[:500])  # 只打印前500字符
        except:
            print("无法获取表单 HTML")

        print("\n📍 步骤 6: 检查控制台和网络")
        print(f"\n控制台消息数: {len(console_messages)}")
        for msg in console_messages[-5:]:  # 只显示最后5条
            if msg['type'] == 'error':
                print(f"  ⚠️ {msg}")

        print(f"\nAPI 请求: {len(api_requests)}")
        for req in api_requests:
            print(f"  {req['method']} {req['url']}")

        print("\n📍 步骤 7: 收集所有选择器")
        # 收集页面上所有的输入元素
        all_inputs = page.locator('input, textarea, select, button').all()
        print(f"\n页面共有 {len(all_inputs)} 个交互元素")
        for i, elem in enumerate(all_inputs[:20]):  # 只显示前20个
            try:
                tag = elem.evaluate('el => el.tagName')
                input_type = elem.evaluate('el => el.type || el.tagName.toLowerCase()')
                placeholder = elem.evaluate('el => el.placeholder || ""')
                name = elem.evaluate('el => el.name || ""')
                text_content = elem.evaluate('el => el.textContent?.trim() || ""')[:30]
                print(f"  [{i}] <{tag}> type={input_type} name={name} placeholder={placeholder} text={text_content}")
            except:
                pass

        # 保持浏览器打开一段时间供手动检查
        print("\n⏸️  浏览器保持打开 30 秒供手动检查...")
        page.wait_for_timeout(30000)

        browser.close()
        print("\n✅ 侦察完成")

        # 返回发现的选择器
        return {
            'found_elements': found_elements,
            'console_messages': console_messages,
            'api_requests': api_requests
        }

if __name__ == '__main__':
    import os
    os.makedirs('screenshots', exist_ok=True)
    recon_mistake_entry()
