---
title: Gradle 杂交不同编译目标（Java）的模块到一个jar
date: 2025-01-29 12:14:11
permalink: /post/gradle-hybrid-target
description: 多个 Java 版本目标的模块，合并到一个jar
categories: 
  - Gradle
tags: 
  - 编程
  - Gradle
sidebar: auto
---

在制作 FiguraAuthProvider 的时候遇到的问题。

我的项目 Java 目标版本是 Java 8，但是 Velocity 需要 Java 17 才能编译，所以我把 Velocity 模块的目标设置成了 Java 17。

我想把 Velocity 模块也要打包到 -all 包里面，但是因为低版本不能依赖高版本的模块，直接添加 `shadow(project(":velocity"))` 会报错。

加一个 `configuration` 就可以做到，不添加依赖也可以 shadow 打包了。

```kotlin
// shadowLink 可以改成你喜欢的任何名称，只要不和原来的冲突就行
val shadowLink = configurations.create("shadowLink")

dependencies {
  //...
  "shadowLink"(project(":velocity"))
  // 或者这样
  add("shadowLink", project(":velocity"))
}

tasks.shadowJar {
  configurations = listOf(shadowLink)
  // 如果需要 implementation、shadow 等也要打包，用以下代码更好
  configurations.add(shadowLink)
  // 如果你不想创建变量 shadowLink，那么使用 project.configurations.getByName("shadowLink")
}
```
