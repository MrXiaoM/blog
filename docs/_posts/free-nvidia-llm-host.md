---
title: 白嫖老黄的 NVIDIA AI 模型
date: 2026-03-20 09:34:23
permalink: /post/free-nvidia-llm-host
description: 只需要一个手机号就可以白嫖
categories: 
  - 日常
tags: 
  - NVIDIA
  - LLM
  - OpenAI
sidebar: auto
---

来源：https://www.xiaoheihe.cn/app/bbs/link/e245718d75da

前往 NVIDIA AI 官网注册账号：https://build.nvidia.com/

然后需要验证手机号，先将 `+1` 区号改成 `+86`，可输入自己的手机号，然后再在地区选择 China，发送短信验证码，验证通过之后就能生成 API Keys 了。

老黄的接口是 OpenAI 兼容的接口，API 端点在 `https://integrate.api.nvidia.com/v1/`。

## Cline

以 Cline 配置为例，使用以下配置即可
+ API Provider - `OpenAI Compatible`
+ Base URL - `https://integrate.api.nvidia.com/v1/`
+ OpenAI Compatible API Key - 输入你生成的密钥
+ Model ID - 搜索一个你喜欢的[模型](https://build.nvidia.com/models)，输入它的 ID，如下所示
  - [`qwen/qwen3.5-397b-a17b`](https://build.nvidia.com/qwen/qwen3.5-397b-a17b)
  - [`deepseek-ai/deepseek-v3_2`](https://build.nvidia.com/deepseek-ai/deepseek-v3_2)

然后你就可以使用这个模型写代码了，限额是每分钟 40 次请求，个人使用大抵是够用的。
