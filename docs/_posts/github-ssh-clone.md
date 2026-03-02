---
title: 为 Github 账户添加 SSH 公钥，使用 SSH 拉取、推送仓库
date: 2026-03-02 22:24:01
permalink: /post/github-ssh-clone
description: 这样连接会更加稳定，几乎不会出现拉取到一半被断开的情况
categories: 
  - 开发
tags: 
  - Github
  - 密钥
  - SSH
sidebar: auto
---

拉取一些大仓库的时候（比如塞了一堆超大图片和网页的 [Iris Dimension](https://github.com/VolmitSoftware/Iris)），稳定性是相当重要的。

Git 没有断点续传，要是中途因为某些众所周知的原因连不上 Github 了，你拉取这么久的进度就归零了！

通过 SSH 来克隆仓库是很简单的。

> 参考官方文档：[新增 SSH 密钥到 GitHub 帐户](https://docs.github.com/zh/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account?tool=webui)
> 
> 以下命令在 Windows 下均使用 CMD 执行，而非 PowerShell。

## 新建密钥

```shell
ssh-keygen -t 密钥类型 -C "你的邮箱"

# 示例，-C 是密钥注释，其实可加可不加
ssh-keygen -t rsa -b 4096 -C "coolxiaom95@gmail.com"
```

没什么特殊需求一路回车即可，新建完毕后，会出来一条提示
```
Your public key has been saved in 公钥路径
```
比如我的是
```
Your public key has been saved in C:\Users\24312/.ssh/id_rsa.pub
```

接下来，执行命令复制公钥
:::: tabs
::: tab Windows
```shell
clip < %USERPROFILE%/.ssh/id_rsa.pub
```
**如果不用 RSA，别直接复制命令执行，注意公钥文件有没有搞错。**
:::
::: tab Linux/MacOS
```shell
pbcopy < ~/.ssh/id_rsa.pub
```
**如果不用 RSA，别直接复制命令执行，注意公钥文件有没有搞错。**
:::
::::

## 到 Github 添加 SSH 公钥

在 [Settings](https://github.com/settings) -> [SSH and GPG keys](https://github.com/settings/keys) 点击 [New SSH key](https://github.com/settings/ssh/new) 以添加一个新的公钥。

+ `Title` 随便填，用来指示这个密钥在哪台设备使用，比如 `""My Computer`。
+ `Key type` 保持默认的 `Authentication Key` 即可。
+ `Key` 填入上一步复制到剪贴板的公钥。

新建公钥之后，在同一台电脑的同一个账户执行以下命令测试连通性
```shell
ssh -T git@github.com
```
如果成功了，会出来一条类似这样的消息
```
Hi MrXiaoM! You've successfully authenticated, but GitHub does not provide shell access.
```

## 通过 SSH 克隆仓库

```shell
git clone git@github.com:作者/仓库.git
```

如下所示

```shell
git clone git@github.com:VolmitSoftware/Iris.git
```
