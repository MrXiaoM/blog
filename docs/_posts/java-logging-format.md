---
title: 自定义 Java Logging 输出的格式
date: 2025-08-04 12:50:32
permalink: /post/java-logging-format
description: 最方便的永远是内置的
categories: 
  - Java
tags: 
  - 编程
  - Java
  - Logger
sidebar: auto
---

测试的时候总想要用 Logger，但是加 log4j 太大了，配置起来也麻烦。

实际上，Java 自带了日志记录器，在 `java.util.logging.*` 里面。

```java
Logger logger = Logger.getLogger("main");
logger.info("hello world");
```

就是它默认输出格式有点别扭

```
八月 04, 2025 12:55:00 下午 top.mrxiaom.pluginbase.resolver.Main main
信息: hello world
```

通过一顿乱找 Java 源码和 javadoc 可以发现，默认的格式是可以通过 JVM 参数 `java.util.logging.SimpleFormatter.format` 修改的。

```java
// 只需要执行这一行代码，就能在运行时修改 JVM 参数
// 要在 LogManager 初始化之前，即 Logger.getLogger(String) 之前执行才有效
System.setProperty("java.util.logging.SimpleFormatter.format", "[%1$tH:%1$tM:%1$tS %4$s] [%3$s]: %5$s%6$s%n");
```

默认的格式是 `%1$tb %1$td, %1$tY %1$tl:%1$tM:%1$tS %1$Tp %2$s%n%4$s: %5$s%6$s%n`，上述示例是我自己看着比较顺眼的格式。

至于格式是什么样的，看看 `java.util.logging.SimpleFormatter` 的源码就知道了。

```java
return String.format(format,
    zdt,                                       // %1 日期时间 ZonedDateTime
    source,                                    // %2 调用 Logger 的来源方法位置
    record.getLoggerName(),                    // %3 Logger 名字
    record.getLevel().getLocalizedLevelName(), // %4 日志等级的本地化名字
    message,                                   // %5 日志消息
    throwable);                                // %6 异常
```

凑合着能用就行，毕竟这可是一行代码就能配置好格式的内置 Logger，用来测试非常方便。

通过上述示例修改格式后，输出结果如下

```
[13:01:36 信息] [Main]: hello world
```
