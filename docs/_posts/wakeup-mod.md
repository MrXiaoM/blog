---
title: 简单修改 WakeUp课程表，去除底栏
date: 2025-09-05 12:25:43
permalink: /post/wakeup-mod
description: 顺道学一下如何方便地修改 APK
categories: 
  - 开发
tags: 
  - 编程
  - 修改
  - Android
sidebar: auto
---

WakeUp课程表 被作业帮收购了，在底栏添加了“搜题”按钮。据说他们之后会提供将底栏去除的设置项，以免滑动课表、点击课程时误触搜题按钮。在正式更新之前，我想试试自己将底栏去除。

::: tip 提示
由于我的技术不精，按本教程进行修改之后，底栏无法完全隐藏。最终会在原本底栏的位置留下一个白边，虽然有点难看，但是也不会误触到搜题按钮了。
:::

::: warning 注意
修改 APK 会造成应用程序的签名变动，不能升级到官方版本，也不能从官方版本升级到修改版本，只能删除再重新安装。

如果你需要修改，请**提前导出备份好课表数据**。
:::

## 准备工作

由于我们只需要修改应用的 `layout`，所以只需要 apktool 和签名工具即可
+ 电脑 (如果你有能耐，也能在手机用 termux)
+ (可选)[VSCode](https://code.visualstudio.com/) 其它编辑器也行，因为不涉及编码问题，用记事本都行
+ [Liberica JDK 21](https://bell-sw.com/pages/downloads/#jdk-21-lts) 我比较习惯用这个版本，其它版本应该也行
+ [apktool 2.12.0](https://github.com/iBotPeaches/Apktool/releases/download/v2.12.0/apktool_2.12.0.jar) APK 修改工具
+ [uber-apk-signer 1.3.0](https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar) APK 批量签名工具

如果 Github 链接无法打开，复制粘贴到[这里](https://ghproxy.net/)即可下载。

将 WakeUp课程表 的安装包和这些工具放到同一个文件夹里，然后右键文件夹空白处，在终端中打开
> 如果你的系统没有终端，可以点击地址栏空白处，输入 `cmd` 然后回车打开命令提示符

这里使用[历趣应用商店](https://os-android.liqucn.com/rj/1188105.shtml)渠道下载的 WakeUp课程表，主要是这个应用商店在电脑下载比较方便，你也可以从手机传安装包到电脑。

将安装包重命名为 `wakeup-schedule.apk`，以方便后续使用。

## 解包 APK 并修改

```shell
java -jar apktool_2.12.0.jar decode wakeup-schedule.apk -o wakeup
```

执行这条命令之后，APK 会被解包到同目录下的 `./wakeup` 文件夹，接下来就能编辑 `layout` 了。

编辑文件 `./wakeup/res/layout/activity_main.xml`，在 `android:id="@id/ai_title_tab"` 那里加个属性 `android:visibility="gone"`，改完之后如下所示
```xml
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout android:id="@id/main_activity_root_view" android:layout_width="fill_parent" android:layout_height="fill_parent"
  xmlns:android="http://schemas.android.com/apk/res/android">
    <com.baidu.homework.common.ui.widget.NoScrollViewPager android:id="@id/pager" android:layout_width="fill_parent" android:layout_height="fill_parent" />
    <com.suda.yzune.wakeupschedule.widget.MainAiTitleTabView android:id="@id/ai_title_tab" android:layout_width="wrap_content" android:layout_height="wrap_content" android:visibility="gone" />
</FrameLayout>
```

## 新建签名

```shell
keytool --genkey -alias wakeup -keyalg RSA -keystore wakeup.jks -keypass wakeup-schedule-mod -storepass wakeup-schedule-mod -validity 7300
```

执行这个命令，并填写信息之后，会新建一个签名文件 `wakeup.jks`，它的密码均为 `wakeup-schedule-mod`，有效期 20 年。

它要求填写的信息可以乱填，填写示例如下
```
您的名字与姓氏是什么?
  [Unknown]:  WakeUp Schedule
您的组织单位名称是什么?
  [Unknown]:  WakeUp
您的组织名称是什么?
  [Unknown]:  WakeUp
您所在的城市或区域名称是什么?
  [Unknown]:  Guangzhou
您所在的省/市/自治区名称是什么?
  [Unknown]:  Guangdong
该单位的双字母国家/地区代码是什么?
  [Unknown]:  CN
CN=WakeUp Schedule, OU=WakeUp, O=WakeUp, L=Guangzhou, ST=Guangdong, C=CN是否正确?
  [否]:  y
```

## 重新打包并签名

重新打包很简单：
```shell
java -jar apktool_2.12.0.jar build wakeup -o wakeup.apk
```
执行之后，如果没有错误，会输出一个 `wakeup.apk` 文件，但由于还没有签名，所以这个文件不能直接拿来安装。

执行以下命令即可将刚刚打包的 apk 文件进行签名：

```shell
java -jar uber-apk-signer-1.3.0.jar -a wakeup.apk --ks wakeup.jks --ksAlias wakeup --ksKeyPass wakeup-schedule-mod --ksPass wakeup-schedule-mod -out ./signed
```

这个命令会将 `wakeup.apk`，使用签名文件 `wakeup.jks`，使用前面创建签名时的密码 `wakeup-schedule-mod` 进行签名，并输出到 `./signed` 目录中。

执行完毕后应该会输出一条这样的消息，就代表签名成功了，可以把签名后的 APK 发给手机安装了。
```
Successfully processed 1 APKs and 0 errors in X.XX seconds.
```
