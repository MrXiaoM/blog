---
title: 解决 gradlew 在 Github Actions 无权限执行问题
date: 2024-10-18 10:49:13
permalink: /post/make-gradlew-executable
description: 通过 git 使得 gradlew 可执行
categories: 
  - Gradle
tags: 
  - 编程
  - 自动构建
  - Github
  - CI
  - Gradle
sidebar: auto
---

我几乎每次配 CI 都忘记将给 gradlew 的执行权限，每次都忘记怎么设置权限，于是记录一下。

```shell
git update-index --chmod=+x gradlew
git commit -m "Make gradlew executable"
git push
```

参考: https://github.com/actions/starter-workflows/issues/171
