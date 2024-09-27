---
title: 使用 Github Actions 工作流发布包到 Maven 仓库
date: 2024-09-27 16:30:20
permalink: /post/maven-publish-ci
description: 基于 Gradle 的一键发布工作流配置教程
categories:
  - Gradle
tags:
  - 网络
  - 编程
  - 自动构建
  - 签名
  - Github
  - CI
  - Maven
  - Gradle
  - GPG
---

首先我们默认你已经搞定了 Maven 仓库的账号密码等等。我们从 GPG 签名开始

## 新建密钥对

本人使用 gpg4win 来创建密钥对，点击「文件」->「新建 OpenGPG 密钥对」，输入「名字」和「电子邮件地址」，勾选「使用密码句保护生成的密钥」。
如果你想一劳永逸，点击「高级设置...」，将「有效期结束于」取消勾选，即为永久有效。

![](https://pic.imgdb.cn/item/66f65ea8f21886ccc0e230ee.png)

在弹出的窗口中输入账号密码，这里设为 `testgpg1234`，请改为你自己的密码。

![](https://pic.imgdb.cn/item/66f65ef8f21886ccc0e27dd3.png)

创建成功后，右键先「在服务器上发布」，然后再点击「备份私钥」，保存为 asc 格式，输入密码后保存，然后用任意文本编辑器打开（记事本也行）先放着备用。

![](https://pic.imgdb.cn/item/66f66013f21886ccc0e38bb8.png)

## 配置发布和签名

在 `build.gradle(.kts)` 中，参考以下配置添加插件和配置。这里我使用 `gradle-nexus-publish-plugin` 插件辅助我发布到 Nexus 仓库。

:::: tabs

::: tab Kotlin
```kotlin
plugins {
    id("java")

    signing
    `maven-publish`
    id("io.github.gradle-nexus.publish-plugin") version "2.0.0"
}

// ...

publishing { // 发布配置
    publications {
        create<MavenPublication>("maven") {
            from(components.getByName("java"))
            groupId = project.group.toString()
            artifactId = rootProject.name
            version = project.version.toString()
            // 需要其它的什么自己加
        }
    }
}
signing { // 签名配置
    val signingKey = findProperty("signingKey")?.toString()
    val signingPassword = findProperty("signingPassword")?.toString()
    if (signingKey != null && signingPassword != null) {
        useInMemoryPgpKeys(signingKey, signingPassword)
        sign(publishing.publications.getByName("maven"))
    }
}
nexusPublishing { // 仓库配置，这里用的是 sonatype 的 s01 仓库
    repositories {
        sonatype {
            nexusUrl.set(uri("https://s01.oss.sonatype.org/service/local/"))
            snapshotRepositoryUrl.set(uri("https://s01.oss.sonatype.org/content/repositories/snapshots/"))
            username.set(findProperty("MAVEN_USERNAME")?.toString())
            password.set(findProperty("MAVEN_PASSWORD")?.toString())
        }
    }
}
```
:::

::: tab Groovy
```groovy
plugins {
    id "java"

    id "signing"
    id "maven-publish"
    id "io.github.gradle-nexus.publish-plugin" version "2.0.0"
}

// ...

publishing { // 发布配置
    publications {
        maven(MavenPublication) {
            from(components.java)
            groupId = project.group.toString()
            artifactId = rootProject.name
            version = project.version.toString()
            // 需要其它的什么自己加
        }
    }
}
signing { // 签名配置
    def signingKey = findProperty("signingKey")
    def signingPassword = findProperty("signingPassword")
    if (signingKey != null && signingPassword != null) {
        useInMemoryPgpKeys(signingKey.toString(), signingPassword.toString())
        sign(publishing.publications.maven)
    }
}
nexusPublishing { // 仓库配置，这里用的是 sonatype 的 s01 仓库
    repositories {
        sonatype {
            nexusUrl.set(uri("https://s01.oss.sonatype.org/service/local/"))
            snapshotRepositoryUrl.set(uri("https://s01.oss.sonatype.org/content/repositories/snapshots/"))
            username.set(findProperty("MAVEN_USERNAME").toString())
            password.set(findProperty("MAVEN_PASSWORD").toString())
        }
    }
}
```
:::

::::

然后，编辑 `gradle.properties`，在里面加入签名信息进行测试。

将之前打开的 asc 私钥文件内容**复制出来**，所有换行替换为 `\n`，放到 `signingKey`。将签名密码放到 `signingPassword`，如下所示。

```properties
signingKey=-----BEGIN PGP PRIVATE KEY BLOCK-----\n\nlIYEZ (中间省略) yAg==\n=H7YT\n-----END PGP PRIVATE KEY BLOCK-----\n
signingPassword=testgpg1234
```

然后执行 `publishToMavenLocal` 任务，将包发布到本地进行测试。

如果没有任何报错，发布后，到 `%HOMEPATH%/.m2/repository` 目录里根据包名寻找发布的文件，如果像图里一样出现了签名文件，则代表签名配置成功了，此时就可以将前面在 `gradle.properties` 里添加的 `signingKey` 和 `signingPassword` 删除了。

**记得一定要删除上面添加的测试配置，不要一不小心把私钥和密码推送上仓库了。**

![](https://pic.imgdb.cn/item/66f666f8f21886ccc0eb8232.png)

## 配置 Github Actions 工作流

在仓库下创建文件 `.github/workflows/publish.yml`，你也可以根据自己的喜好命名，文件内容如下。这个自动构建配置需要手动执行，你可以根据你自己的需要修改执行条件。

```yaml
name: Publish to Maven Central
on:
  workflow_dispatch:

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
        # 拉取代码
      - name: Checkout
        uses: actions/checkout@v3
        with:
          # 保留所有 commits 记录
          fetch-depth: 0
        # 安装 Java 11
      - name: Set up Java
        uses: actions/setup-java@v3
        with:
          java-version: '11'
          distribution: 'adopt'
        # 执行发布任务
      - name: Publish package
        uses: gradle/gradle-build-action@v2
        with:
          # 如果你没改过前面发布配置里的名字“maven”，就是这个任务名
          # 如果改过，就是 publish【XXX】PublicationToSonatypeRepository
          arguments: publishMavenPublicationToSonatypeRepository closeAndReleaseSonatypeStagingRepository
        # 通过环境变量传递 secrets 到 发布任务 和 签名任务
        env:
          ORG_GRADLE_PROJECT_signingKey: ${{ secrets.SIGNING_PRIVATE_KEY }}
          ORG_GRADLE_PROJECT_signingPassword: ${{ secrets.SIGNING_PASSWORD }}
          ORG_GRADLE_PROJECT_MAVEN_USERNAME: ${{ secrets.OSSRH_USERNAME }}
          ORG_GRADLE_PROJECT_MAVEN_PASSWORD: ${{ secrets.OSSRH_TOKEN }}
```

接下来还需要配置 Secrets 供工作流读取，首先，进入仓库主页，点击仓库的「Settings」（注意不是用户的 Settings），往下翻，找到「Secrets and variables」，点击「Actions」，来到这个页面。

![](https://pic.imgdb.cn/item/66f669e7f21886ccc0ef63e2.png)

依次添加表格中的内容

| Name | Secret |
| --- | --- |
| SIGNING_PRIVATE_KEY | 第一步**新建密钥对**让你打开备用的 asc 私钥文件的内容 |
| SIGNING_PASSWORD | 第一步**新建密钥对**的密码，比如本文示例的 `testgpg1234` |
| OSSRH_USERNAME | Maven 仓库账号 |
| OSSRH_TOKEN | Maven 仓库密码 |

## 完成

至此，你已完成通过 Github Actions 发布包到 Maven 仓库的配置。如果你是完全使用本教程提供的工作流配置，到仓库的 Actions 页，点击 Run workflow 即可一键运行发布。

![](https://pic.imgdb.cn/item/66f66acaf21886ccc0f091a3.png)
