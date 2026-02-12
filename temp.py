import requests

def get_modelscope_remaining_quota(api_key, model_name):
    """
    获取ModelScope模型的当日剩余调用额度
    :param api_key: 你的ModelScope API-KEY
    :param model_name: 模型名称（如 deepseek-ai/DeepSeek-V3.2）
    :return: 字典，包含模型专属额度和账号总额度
    """
    url = "https://api-inference.modelscope.cn/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}"}
    data = {
        "model": model_name,
        "messages": [{"role": "user", "content": "测试"}],
        "stream": False
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        if response.status_code != 200:
            return {"error": f"调用失败，状态码：{response.status_code}", "content": response.text}
        
        # 提取核心额度字段
        quota_info = {
            # 模型专属额度
            "model_daily_limit": response.headers.get("Modelscope-Ratelimit-Model-Requests-Limit"),
            "model_remaining": response.headers.get("Modelscope-Ratelimit-Model-Requests-Remaining"),
            # 账号总额度
            "account_daily_limit": response.headers.get("Modelscope-Ratelimit-Requests-Limit"),
            "account_remaining": response.headers.get("Modelscope-Ratelimit-Requests-Remaining")
        }
        return quota_info
    
    except Exception as e:
        return {"error": f"调用出错：{str(e)}"}

# 替换为你的API-KEY和模型名
API_KEY = "ms-7d727c42-3300-4fdc-8083-b94c7b7dfea1"
MODEL_NAME = "Qwen/Qwen3-30B-A3B-Instruct-2507"

# 调用函数并打印结果
quota = get_modelscope_remaining_quota(API_KEY, MODEL_NAME)
if "error" in quota:
    print("获取额度失败：", quota["error"])
else:
    print("==== 模型额度信息 ====")
    print(f"模型 {MODEL_NAME} 当日总限额：{quota['model_daily_limit']} 次")
    print(f"模型 {MODEL_NAME} 当日剩余次数：{quota['model_remaining']} 次")
    print("\n==== 账号总额度信息 ====")
    print(f"账号全平台当日总限额：{quota['account_daily_limit']} 次")
    print(f"账号全平台当日剩余次数：{quota['account_remaining']} 次")