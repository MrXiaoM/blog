---
title: 构建 Paper 衍生服务端（Purpur、Folia 等）时使用代理避免拉取失败
date: 2025-02-24 13:18:26
permalink: /post/paperweight-mirror
description: 构建 Folia 偶遇 paperweight，拼尽全力无法拉取仓库
categories: 
  - Minecraft
tags: 
  - Paper
  - Gradle
sidebar: auto
---


你可能会在构建 Paper、Purpur、Folia 时遇到这种问题

![](https://pic1.imgdb.cn/item/67bc017ed0e0a243d4033616.png)

`clonePaperRepo` 任务在执行 `git` 命令的时候出现了一个异常。通常来说都是网络问题导致的，也就是连不上 Github。

每次构建，paperweight 都会从 Github 拉取一次 `PaperMC/Paper` 这个仓库，以同步上游变更。

总所周知，Github 可能是由于 CDN 节点或者某些原因，会有一段时间无法访问有一段时间又可以访问。这使得构建的可用性受到较大影响。

根据 paperweight 的特性，可以在构建脚本（`build.gradle.kts`）中添加以下代码来使用 gh-proxy 增加稳定性。

::: warning
这里的方法仅适用于 paperweight `1.5.15`，其它版本请对比[源码](https://github.com/PaperMC/paperweight/blob/v1.5.15/paperweight-patcher/src/main/kotlin/io/papermc/paperweight/patcher/PaperweightPatcherExtension.kt#L86-L95)，检查下有没有变更。
:::

```kotlin
// 修改 paperweight 配置
// 这里以 Purpur 作为示例，具体要看你的构建脚本里是怎么写的

paperweight {
    // ...

    // 找到 usePaperUpstream
    usePaperUpstream(providers.gradleProperty("paperCommit")) {

        // 在它开头添加以下代码
        fun String.mirror(): String {
            // 如果这个加速服务不能用了，自己找一个换上去
            return "https://github.moeyy.xyz/$this"
        }
        url.set(github("PaperMC", "Paper").mirror())
        // 只有上面的需要添加，下面的都是 Purpur 原来的了

        withPaperPatcher {
          // ...
        }
        // ...
    }
    // ...
}
```

## 无脑方法

改成这样，在中国大陆地区运行，才会使用加速服务。可以很方便地在本机编译或者在 Github Actions 编译而不影响速度。


:::: tabs
::: tab 1.5.15

```kotlin
import java.util.*

// ...

fun io.papermc.paperweight.patcher.upstream.RepoPatcherUpstream.decideUseMirror() {
    if (Locale.getDefault().country == "CN") {
        val github = url.get()
        url.set("https://github.moeyy.xyz/$github")
    }
}

paperweight {
    // ...

    // 找到 usePaperUpstream
    usePaperUpstream(providers.gradleProperty("paperCommit")) {
        decideUseMirror()
    }
}
```

:::
::: tab 2.0.0-beta.14

```kotlin
import java.util.*

// ...

fun io.papermc.paperweight.core.extension.UpstreamConfig.decideUseMirror() {
    if (Locale.getDefault().country == "CN") {
        val github = repo.get()
        repo.set("https://github.moeyy.xyz/$github")
    }
}

paperweight {
    // ...

    // 找到 upstreams.xxx
    upstreams.paper {
        decideUseMirror()
    }
}
```

:::
::::
