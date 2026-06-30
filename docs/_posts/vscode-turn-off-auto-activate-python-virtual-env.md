---
title: 在 VSCode 中关闭自动激活 Python 虚拟环境，以免跟 AI 执行终端命令打架
date: 2026-05-26 15:46:24
permalink: /post/vscode-turn-off-auto-activate-python-virtual-env
description: 每新建一个终端执行命令就被激活虚拟环境打断，真的很烦
categories: 
  - 开发
tags: 
  - AI
  - VSCode
  - Python
sidebar: auto
---

我目前在用 Zoo Code 进行开发，它是 VSCode 的一个插件，我设置了让它使用 VSCode 内置的终端来执行命令，这样方便我查看执行结果。

不过最近总是出现命令执行被打断的问题，甚至出现了 Zoo Code 将激活虚拟环境的执行结果当做命令执行结果回传给 AI 的情况，导致 AI 读到 Exited Code 0 以及空输出，误以为命令执行成功。这就必须要把这个自动激活虚拟环境功能给关掉了。

## 自动激活是哪里来的

如果你按照 VSCode 自动语言建议，安装了 Python 扩展，应该会捆绑一个叫 Python Environments 的扩展，有它在，会自动识别并使用正确的 Python 解释器来进行智能提示。

但是也正是因为有它在，打开终端的时候也会执行一条“先 Ctrl+C 取消，再激活虚拟环境”的命令。

在 VSCode 设置里面搜索 `@ext:ms-python.vscode-python-envs Auto`，设置成 `off` 就能关掉终端自动激活虚拟环境了。

还可以搜索 `@ext:ms-python.vscode-python-envs Show`，将选项开启，这样终端就会有个激活 Python 环境的按钮了，需要的时候可以点击执行命令激活虚拟环境。

> 微软你看看你干的什么好事 😡😡😡

如果你用的新版本扩展，还需要搜索以下内容，去关闭额外的选项，也就是说 Python 扩展自带了环境贡献功能，用不着 Python Environments 了，所以相关选项变多了
+ `python.terminal.shell`
+ `python.terminal.activate`
