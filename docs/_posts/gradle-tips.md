---
title: Gradle 的一些小技巧
date: 2025-08-28 20:23:14
permalink: /post/gradle-tips
description: 讲一点自己的心得
categories: 
  - Gradle
tags: 
  - Gradle
  - Java
  - 编程
sidebar: auto
---

整理一些小技巧，不定期更新。以 kotlin dsl (`build.gradle.kts`) 为主。

## Maven 仓库添加

一般来说，我们通常直接在 repositories 里添加仓库，越在前面的优先级越高。
```kotlin
repositories {
    maven("https://mirrors.huaweicloud.com/repository/maven/")
    mavenCentral()
}
```

但是，一些仓库在不同地区的速度不同，例如上述的华为云镜像在 Github Actions 上的效果就不一定有 Maven Central 官方仓库好。当我们需要这个项目仅在中国地区的机器上运行时使用该仓库，可以使用 `java.util.Locale` 实现这个功能。
```kotlin
import java.util.Locale

repositories {
    if (Locale.getDefault().country == "CN") {
        maven("https://mirrors.huaweicloud.com/repository/maven/")
    }
    mavenCentral()
}

```

## 依赖添加

实际上，依赖可以使用以下三种格式

```kotlin
dependencies {
    // 这两种适用于一般情况
    配置名(group="分组", name="构件名", version="版本", classifier="分类", ext="扩展名")
    配置名("分组:构件名:版本:分类@扩展名")
    // 这种适用于在 subprojects 块中，也就是项目还在早期加载阶段，出不来配置名补全的时候使用
    add("配置名", "分组:构件名:版本:分类@扩展名")
}
```

我们最常用的是以下格式
```kotlin
配置名("分组:构件名:版本:分类@扩展名")
// 例如
compileOnly("com.google.code:gson:2.8.0")
```

其中，`分类`默认为`""`，扩展名默认为`"jar"`，这俩可以不输入。

最终会将组名的`.`替换为`/`，下载 `组名/构件名/版本/构件名-版本(-分类).扩展名` 这个文件，例如上述的 gson 为 `com/google/code/gson/2.8.0/gson-2.8.0.jar`。

分类通常用于 [shadowJar](https://github.com/GradleUp/shadow)，例如通过 shadow 打包的文件名都会有个 `-all` 结尾，这个 `all` 就是分类。

为什么我要研究这个呢？因为我在 lumine 的仓库遇到了[这玩意](https://mvn.lumine.io/#browse/browse:maven-public:org%2Fspigotmc%2Fspigot-1.7.10%2Fdev%2Fspigot-1.7.10-dev.8.jar)。

`org/spigotmc/spigot-1.7.10/dev/spigot-1.7.10-dev.8.jar`

别看了，Nexus Repository 给的 Usage 是错的，在这种情况下，特别还是不知道上面这些知识的时候，你要怎么引用这个依赖？

了解以上的知识后，就可以反向猜出
+ 分组为 `org.spigotmc`
+ 构件名为 `spigot-1.7.10`
+ 版本为 `dev`
+ 扩展名为 `8.jar`

是的，扩展名为 `8.jar`，这是哪个神人想出来这样发版的，给我气笑了。最终可以这样在 Gradle 添加依赖。
```kotlin
compileOnly(group="org.spigotmc", name="spigot-1.7.10", version="dev", ext="8.jar")
compileOnly("org.spigotmc:spigot-1.7.10:dev@8.jar")
add("compileOnly", "org.spigotmc:spigot-1.7.10:dev@8.jar")
```

## 从其它子模块合并源码Jar

我们可以简单地添加以下配置，以便在构建的时候生成 `-sources.jar` 和 `-javadoc.jar`，这也会自动添加到 publishing 配置。
```kotlin
java {
    withSourcesJar()
    withJavadocJar()
}
```
但是有时会出现一种情况，就是一个模块只是为了分享共同接口，没有必要单开一个模块，但是又必须开一个模块，否则会出现循环引用依赖问题。

在发布到 maven 仓库的时候，我想让 `shared` 模块的源代码和 javadoc 都打包到主要模块里面，可以这样做：
```kotlin
tasks {
    // 获取当前模块的 sourcesJar 任务
    getByName<Jar>(project.sourceSets.main.get().sourcesJarTaskName) {
        // 将 shared 模块的源码全部加进来
        from(project(":shared").sourceSets.main.get().allSource)
    }
    // 获取当前模块的 javadoc 任务
    // 之所以不获取 javadocJar，是因为 javadocJar 是没法合并的，只能从生成这块下手    
    getByName<Javadoc>(sourceSets.main.get().javadocTaskName) {
        // 获取 shared 模块的 javadoc 任务
        val task = project(":nms:shared").run {
            val taskName = this@run.sourceSets.main.get().javadocTaskName
            this@run.tasks.named<Javadoc>(taskName).get()
        }
        // 将 javadoc 任务的源码全部加到当前任务
        source += task.source
    }
}
```
