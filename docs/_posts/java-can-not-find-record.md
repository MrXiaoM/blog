---
title: 关于 找不到java.lang.Record的类文件 的解决方案
date: 2026-03-07 21:05:40
permalink: /post/java-can-not-find-record
description: Java 8 引用高版本依赖，提示 无法访问Record 的解决方案
categories: 
  - 开发
tags: 
  - Java
  - Gradle
  - 兼容
sidebar: auto
---

做 Minecraft 服务器插件开发的时候可能会遇到的问题。

当你想做一个能兼容至 Java 8、Minecraft 1.8 的插件的时候，必定要设置`源兼容性`和`目标兼容性`的版本为 `8`。当你需要引用一个使用 Java 17 编译的依赖的时候，Maven 不会阻止，Gradle 会不让你引用，只需要添加以下配置即可解除限制。

```kotlin
java {
    disableAutoTargetJvm()
}
```

> 即使你要编译目标版本为 `8`，也要用 JDK 21 来运行。旧版本不认识新版本的字节码格式，检测到版本太高就会拒绝读取并报错。所以一定要用 JDK 21 来编译，不管你的目标编译版本是多少。

当然，你点进来这篇文章肯定不是为了看这个的，最主要的问题在下面。

如果你使用了一个 Java 17 的 Record 类，编译时就会出现如下报错：
```
I:\.development\Sweet\SweetMail\src\main\java\top\mrxiaom\sweetmail\utils\items\CraftEngineProvider.java:15: 错误: 无法访问Record
        CustomItem<ItemStack> customItem = CraftEngineItems.byId(Key.of(argument));
                                                                    ^
  找不到java.lang.Record的类文件
```

一开始我还没找到很好的解决方法，只能一点一点去试它的行为。

最后发现，你可以去调用它的构造函数，但是不能去调用它的任何方法，包括静态方法都不行。

我不知道 Java 编译器是怎么工作的，但就这个行为来看，可能是在调用方法这块，为了找到调用的方法是**当前类的方法**还是**父类的方法**，需要去找父类的方法列表看看有没有匹配的，再看当前类有没有重载的方法。

诶☝️🤓，构造方法就不可能有重载了，我亲自试过，调用 Record 类的构造方法是能成功编译不报错的。

所以我的解决方法如下，查一下 `Key.of` 的源代码，抄过来就行了。
```java
    public static Key of(String namespacedId) {
        String[] strings = new String[]{"minecraft", namespacedId};
        int i = namespacedId.indexOf(':');
        if (i >= 0) {
            strings[1] = namespacedId.substring(i + 1);
            if (i >= 1) {
                strings[0] = namespacedId.substring(0, i);
            }
        }
        return new Key(strings[0], strings[1]);
    }
```

## 变通一下

如果你真的要访问 Record 类的方法，如果是在 Object 里就有的方法（`equals`、`toString`、`hashCode` 等）可以用以下方式访问
```java
    public static boolean toString(Key key) {
        // noinspection RedundantCast: 消除“不必要的转换”警告
        return ((Object) key).toString();
    }
```
我调用的可是 `Object` 的 `toString()`，`Key` 什么的真不熟。做一个强制转换就绕过检查 Record 这个父类了。

同理，如果这个类实现了什么其它的接口，也能通过强制转换来调用接口的方法。

## 最坏的情况

如果你真的要调用 Record 类的方法，假设要调用 `Key#asMinimalString()`，也有一个不是很优雅的方法。

新建一个子模块，添加一个类，名为 `java.lang.Record`，写入以下内容

```java
package java.lang;

public abstract class Record {}
```

然后通过 `compileOnly()` 来引用这个子模块即可。

能正常编译，但之后会不会出现非预期结果就不知道了，我没有这个需求。

::: details 完整操作流程

仅限 Gradle 使用，我不会写 Maven。当然，将 `record-stub` 编译一个 jar 出来给 Maven 用也是可以的。

```kotlin
// settings.gradle.kts

include(":record-stub")
```

```kotlin
// record-stub/build.gradle.kts
plugins {
  id("java")
}
val targetJavaVersion = 8
java {
    val javaVersion = JavaVersion.toVersion(targetJavaVersion)
    if (JavaVersion.current() < javaVersion) {
        toolchain.languageVersion.set(JavaLanguageVersion.of(targetJavaVersion))
    }
}
tasks.withType<JavaCompile>().configureEach {
    options.encoding = "UTF-8"
    if (targetJavaVersion >= 10 || JavaVersion.current().isJava10Compatible) {
        options.release.set(targetJavaVersion)
    }
}
```
```java
// record-stub/src/main/java/java/lang/Record.java
package java.lang;

public abstract class Record {}
```

然后再在 `build.gradle.kts` 里这样引用依赖即可
```kotlin
compileOnly(project(":record-stub"))
```
:::

## 总结

大致总结一下 Record 类在 Java 8 下的行为

+ 不能调用其中的任何方法（字段可能也是）
+ 可以调用它的构造方法
+ 变通一下，做个强制转换可以调用其中一些方法
+ 静态方法大概没有办法去调用
