---
title: 记一次从 Sonatype OSSRH 迁移到 Maven Central Publishing Portal
date: 2025-04-24 00:15:42
permalink: /post/oss-transfer-to-portal
description: 悲报，OSSRH 将于 2025年6月30日 进入生命周期末尾
categories: 
  - Gradle
tags: 
  - Maven
  - Gradle
  - Central
  - OSSRH
  - 编程
sidebar: auto
---

![](https://pic1.imgdb.cn/item/680670c458cb8da5c8bd253e.png)

很久以前在 jira 申请了 OSSRH 的仓库权限，在 Central Publishing Portal 推出的时候，jira 的申请通道关闭了，当时我感觉新的站点不太好用，就没太多去关注。现在，OSSRH 很快就要停止服务了，不得不去了解如何迁移到 Portal 了。

Sonatype 提供了 [Portal OSSRH Staging API](https://central.sonatype.org/publish/publish-portal-ossrh-staging-api/)，只要替换仓库地址就能完成迁移。但是会有一点限制，未来也有可能会把这个接口给取消。所以，我们一步到位，直接迁移到 [Portal API](https://central.sonatype.org/publish/publish-portal-gradle/)。

> 想直接上手可以[看看这里](https://github.com/MrXiaoM/Overflow/pull/148/files)。

## 了解 Portal API 差别

粗浅地理解，以前的 Staging API 是由插件直接发布 artifact 到暂存仓库，然后通过关闭暂存仓库来合并内容到 OSSRH 仓库中。在关闭仓库时，OSSRH 会进行一系列检查，比如签名、javadoc 等等，不通过时向客户端报错，让开发者登录 OSSRH 手动处理。

现在，Portal API 改成了上传 zip 压缩包。大概是这样，在写这一段的时候，我也没有多了解新的接口。看了几个迁移新旧接口的插件，现在要做的就是，本地做一个暂存仓库，最终发布时将暂存仓库内容打包上传，即可造成最小影响。

做完迁移之后，我对 Portal API 的理解更深了一点，翻到[基本原理](#基本原理)查看。

## 迁移账号

::: warning
账号迁移后，你将无法在 OSSRH 登录原来的账号，请提前做好准备。
:::

OSSRH 跟 Central Portal 的账号是不互通的，所以要按[官方指引](https://central.sonatype.org/faq/what-is-different-between-central-portal-and-legacy-ossrh/)进行账号迁移。

然后登录你的 OSSRH，看看你的邮箱是多少

![](https://pic1.imgdb.cn/item/6804bd9f58cb8da5c8b92a63.png)

如果你没有用过子域（比如根域名是 `top.mrxiaom`，如果发布过 `top.mrxiaom.mirai:overflow-api` 这样的包，就代表使用过子域），可以直接到 [Central](https://central.sonatype.com/) 用这个邮箱找回密码登录，然后在 [namespaces](https://central.sonatype.com/publishing/namespaces) 页面点击 `Migrate Namespace` 自助迁移。

我是用过子域的，~~所以先在 https://central.sonatype.com/ 注册一个账号并登录。使用 Github 账号注册登录，之后会比较方便一点。~~ 用过子域也要在 [Central](https://central.sonatype.com/) 登录原来在 OSSRH 的账号，截图一个这个，放邮件附件。

![](https://pic1.imgdb.cn/item/6805033d58cb8da5c8ba26c9.png)

我之前写了一大段，删掉了重写，因为我发现 central support 的客服会跟你扯皮，如果你不明说你要进行 Manual Migration，它们会坚持让你尝试 Self-Service Migration，就好像默认你从来没看过文档一样。即使你一再强调你无法进行自助迁移，最后给出截图，客服发现自己理亏（或者它们的勾实系统，在回复里面根本不支持接收附件），不了了之。

鉴于这个原因，我也不奢求什么把 `top.mrxiaom` 给移到使用 Github 账号登录的 Central Portal 账号下了，就客服这副德行，能给我完成迁移算不错了。

```
收件人: central-support@sonatype.com
标题: Request Manual Migration from Legacy OSSRH to Central Portal
正文:
I am <用户ID> from <仓库地址>. I have read the document from https://central.sonatype.org/faq/what-is-different-between-central-portal-and-legacy-ossrh/ and also tried self-migration but failed (Screenshot in attachment). So DO NOT tell me to self-migrate. I have tried and failed.

I have learnt how to publish to Central Portal from the document. So please just perform the manual migration.
```
反复强调自己已经进行过自助迁移并失败，直接进行手动迁移。上述变量在之前的截图中都有对应的
+ `<用户ID>` 为 `mrxiaom`
+ `<仓库地址>` 为 `https://s01.oss.sonatype.org/`

虽然文档说明 Central Support 会验证命名空间是否还属于你，但我并没有被要求重新验证，直接过了，看情况吧。过了之后登录 Central Portal 的 `Namespace` 页面会显示你的命名空间已经 `Verified`，就像下图一样。因为我个人需要，我还开了 `Enable SNAPSHOTs`，如果你不需要可以不开。

![](https://pic1.imgdb.cn/item/68066b4858cb8da5c8bd22cd.png)

## 更换插件

我之前使用的是 `gradle-nexus-publish-plugin`，之前的详细配置请参阅[我之前的博文](/post/maven-publish-ci)。

现在，我打算换成 [Karlatemp/maven-central-publish](https://github.com/Karlatemp/maven-central-publish)。

插件只需要加在根项目（`rootProject`）就行了。其它子项目跟往常一样，使用 publishing 插件（`maven-publish`）添加发布。
```kotlin
plugins {
  id("moe.karla.maven-publishing") version "1.0.2"
  id("maven-publish")
  id("signing")
}

mavenPublishing {
    // 设置成手动发布（运行结束后要到 Central 确认发布），如果要自动发布，就用 AUTOMATIC
    publishingType = PublishingType.USER_MANAGED
    // 改成你自己的信息
    url = "https://github.com/用户名/仓库"
    developer("用户名", "邮箱")
}

```
注意事项基本就上面这些，剩下的按仓库的 README 操作即可。

## 配置 SNAPSHOT 仓库

你应该注意到上面我开启了 `Enable SNAPSHOTs`，要发布到快照仓库的话，跟往常一样发布即可，快照仓库没有用 Portal API，像这样添加仓库然后发布就行了

相关文档详见 [Publishing `-SNAPSHOT` Releases](https://central.sonatype.org/publish/publish-portal-snapshots/)。
```kotlin
publishing {
    repositories {
        maven {
            name = "CentralSnapshots"
            // groovy
            url = "https://central.sonatype.com/repository/maven-snapshots/"
            // kotlin
            setUrl("https://central.sonatype.com/repository/maven-snapshots/")
            // 登录仓库
            credentials {
                // 账号密码通过 Generate User Token 获取
                // https://central.sonatype.com/account
                username = "账号"
                password = "密码"
            }
        }
    }
}
```

跟以前一样，运行 `publish__XXX__PublicationsToCentralSnapshotsRepository` 任务即可发布（`__XXX__` 改为发布名称，`All` 为全部发布）。

## 兼容更复杂的情况

由于我使用的这个插件使用的方案有点生硬，比较适合一般情况，遇到复杂的情况可能招架不过来。

::: tip
我为 Overflow 进行迁移的所有变更[在这里](https://github.com/MrXiaoM/Overflow/pull/148/files)，将上文提到的插件源码复制到了 buildSrc 里进行修改，参考了以下文档
+ [Publishing By Using the Portal Publisher API](https://central.sonatype.org/publish/publish-portal-api/)
+ [Publishing By Uploading a Bundle](https://central.sonatype.org/publish/publish-portal-upload/)
+ [Publishing `-SNAPSHOT` Releases](https://central.sonatype.org/publish/publish-portal-snapshots/)
:::

通过修改，支持了以下特性
+ 可以发布 SNAPSHOT 版本
+ 原本插件会自动覆盖 POM，我早就准备好 POM 了，不需要它，删了
+ 原本插件会强制替你管理签名，我早就配好签名了，不需要它，删了

要注意的是，在测试的时候，要设置 `publishingType = PublishingType.USER_MANAGED`。这样，发布 release 版本到 Portal，不会真的发布出去，你可以在 [Deployments](https://central.sonatype.com/publishing) 页面查看是否成功，如果不成功会提示原因（一般是没签名、没 javadoc、把 SNAPSHOT 版本发上来了、目录格式错误等等乱七八糟的问题，跟以前一样），如果成功会显示 `VALIDATED`。

![](https://pic1.imgdb.cn/item/68090fa658cb8da5c8c6bbd4.png)

这时，你可以选择点击 `Drop` 丢弃这个提交，或者点击 `Publish` 确认发布。在测试的时候挺方便的，等你测试到显示 `VALIDATED` 再把发布模式改成 `AUTOMATIC` 最合适。

## 基本原理

通过为 Overflow 做 Portal API 发布兼容，特别是阅读上面提到的 [Publishing By Uploading a Bundle](https://central.sonatype.org/publish/publish-portal-upload/) 可以得知，实际上，接口没有多大变化。

从直接发布到 OSSRH 的暂存仓库，在检查结束后发布，变成了先发布到本地的暂存仓库（这个插件的暂存仓库，是在根项目的 `./build/maven-publishing-stage/` 目录），然后打包成 `bundle.zip`，再调用 `POST /api/v1/publisher/upload` 上传。

通过文档可知，`bundle.zip` 可以一次性提交多个 artifact，所以，发布插件只需要装在根项目就可以了，因为它需要做的只有
+ 管理暂存仓库目录
+ 打包zip
+ 调用接口上传

只需要通过原来自带的 `maven-publish` 插件，将包发布到这个暂存仓库，让插件打包上传即可。
