---
title: PICO 相关资料，关于刷机/调整/主题/场景等
date: 2026-05-24 21:38:35
permalink: /post/pico-data
description: 整理网上的零散资料，便于后续查找
categories: 
  - 资料
tags: 
  - PICO
  - VR
sidebar: auto
---

比较完整地整理 PICO 资料的文章好像不多，毕竟 PICO 一般就用来 SteamVR 串流，也不用多深入地跟手机一样去研究 root 之类的。

在[上一篇文章](/post/pico-4-upgrade-guide)折腾系统升级时，找资料找得我挺辛苦的，所以我决定整理一下我目前为止收集的相关知识和资料，放到这篇文章中。

这篇文章可能会不定期更新。

## 开发者模式

进入 `设置` -> `通用` -> `关于本机`，找到 `软件版本号`，连续点击版本号多次，在 `通用` 下方会出现 `开发者` 选项。

在开发者选项中，比较重要的是：
+ `USB 调试开关` - 决定了是否可以使用 ADB
+ `USB连接` - 决定了是否可以在电脑传输文件到头显

## 社区资源

+ [Discord / owomushi - PICO VR](https://discord.gg/wyhQJRUgQK)
+ [OwoMushi / Pico Vr Resource](https://owomushi.com/)
+ [crx's Pico Wiki / Introduction](https://pico.crx.moe/docs/intro)

## OEM 机器

PICO 分为 `OEM` 和 `non-OEM` 两种变体。老实说，我并不知道两者有什么区别，只知道两者的系统不通用。

要分辨你的 PICO 机器是否为 OEM 机器，在 ADB 中执行：
```shell
adb shell getprop ro.oem.state
```
+ 出现 `true` 代表该机器是 OEM 机器
+ 出现一行空白代表该机器是非 OEM 机器

在获取到当前机器是否为 OEM 机器之后，再去下载相应更新包。

## 系统更新包下载

在以下两个网站可以获取 PICO 不同版本的更新包下载地址，转跳到 PICO 官方 CDN 下载
+ [owomushi.com](https://owomushi.com/Pico-Firmware/)
+ [owomushi.com (PICO 4)](https://owomushi.com/Pico-4-Archive/)
+ [pico.crx.moe](https://pico.crx.moe/docs/picoos-research/version-table/)

官方离线更新教程在官方文档有：
+ [新版本方式](https://developer-cn.picoxr.com/document/unity/offline-upgrade-device-system-version/)
+ [旧版本方式](https://developer-cn.picoxr.com/document/unity/offline-upgrade-device-system-version/?v=2.5.0)

系统只能升级，无法降级，在升级之前要先想好。

正式重启升级时，会进入 Recovery 模式进行升级，如果官方包出现了签名校验错误的报错，可能说明你的机子 Recovery 已经被篡改了，无法适配官方包。如果有 root 权限，可以先从官方更新包提取 `recovery.img` 出来，刷进去再更新。

## 转换/解包镜像

通常在系统更新包里，有多个 Android data image 格式 (`.dat`) 的分区镜像，它们通常有这两个重要的文件：
+ `分区名.new.dat.br`
+ `分区名.transfer.list`

通过 [Brotli](https://github.com/google/brotli) 工具可以将 `.dat.br` 文件解压为 `.dat` 文件，通过 [sdat2img](https://github.com/xpirt/sdat2img) 工具可以将 `.new.dat` 和 `.transfer.list` 转换为更加通用的 `.img` 文件。

工具安装流程如下（需要 Linux 系统，在 Windows 可用 WSL 代替）：
```shell
cd ~
sudo apt install python3 brotli git
git clone https://github.com/xpirt/sdat2img
```

以 `system` 分区为例，用法如下：
```shell
# 先解压为 system.new.dat
brotli -d -o system.new.dat system.new.dat.br
# 然后转换为 system.img
python3 ~/sdat2img/sdat2img.py system.transfer.list system.new.dat system.img
```

获得 `.img` 文件之后，可以下载 [MTK Extractor](https://androidmtk.com/download-mtk-extractor) 来解包这些文件。

## 软件下载

+ [ADB 平台工具](https://developer.android.google.cn/tools/releases/platform-tools?hl=zh-cn)
  - 包含常用调试工具，例如 `adb` 和 `fastboot`
  - [Windows 下载直链](https://googledownloads.cn/android/repository/platform-tools-latest-windows.zip)
+ [PICO 互联 (适用于系统 5.11.2+)](https://www.picoxr.com/cn/software/pico-link)
  - 用于 SteamVR 串流的官方工具
  - [历史版本/国际版下载](https://github.com/owomushi/Pico-Connect/releases)
+ [游戏串流助手 (适用于旧版本系统)](https://alistatic.pui.picovr.com/StreamingAssistantSetup_9.5.6.2_116-20230725.exe)
  - 用于 SteamVR 串流的官方工具

## 常用 ADB 命令

基本可以当做正常安卓设备来使用。
| 命令 | 作用 |
| --- | --- |
| `adb root` | 进入 root 特权模式，需要 userdebug 类型的系统才能使用 |
| `adb shell` | 进入 ADB Shell，用于执行命令 |
| `adb pull 文件路径` | 拉取头显中的指定文件到电脑 |
| `adb push 文件路径 保存路径` | 推送电脑中的指定文件到头显，保存路径无需文件名，例如 `/sdcard/` |
| `adb reboot recovery` | 使得头显进入 Recovery 模式 |
| `adb reboot bootloader` | 使得头显进入 Fastboot 模式 |

其中，ADB Shell 又有以下命令较为常用，大可以当 Linux 来用。
| 命令 | 作用 |
| --- | --- |
| `exit` | 退出 ADB Shell |
| `cd 路径` | 切换文件夹 |
| `ls -l` | 查看当前文件夹下的文件列表 |
| `pm` | 包管理器相关命令 |
| `pm uninstall --user 0 包名` | 卸载预装应用 |

顺带一提，PICO 的 Fastboot 模式有操作超时时间，而且用户基本看不见屏幕内容。不像 Recovery 模式一样界面元素居中，PICO 的 Fastboot 模式的画面元素是平铺整个屏幕的，四角视觉死角根本看不见，基本只能通过电脑操作。

至少在 PICO 4，是没有 A/B 分区的，在 ADB Shell 中也可以使用这些命令来刷写分区
| 命令 | 作用 | 示例 |
| --- | --- | --- |
| `dd if=分区 of=镜像路径` | 备份分区到指定路径 | `dd if=/dev/block/by-name/recovery of=/sdcard/pico_recovery.bak.img` |
| `dd if=镜像路径 of=分区` | 刷入指定镜像到指定分区 | `dd if=/sdcard/recovery.img of=/dev/block/by-name/recovery` |
| `sync` | 刷入分区之后，需要执行这个来同步变更 | `sync` |

## 关闭开机推荐

用 ADB 卸载掉 `com.pvr.home` 这个应用，开机就没有推荐显示了
```shell
adb shell pm uninstall --user 0 com.pvr.home
```

## 自定义场景/主题

使用开源的主题管理器项目 [PicoThemeManager](https://github.com/Nyabsi/PicoThemeManager) 来实现修改自定义场景功能
1. 下载并安装 [PicoThemeManager.apk](https://github.com/Nyabsi/PicoThemeManager/releases)
2. 在 ADB 授予应用修改设置的权限
   ```shell
   adb shell pm grant cc.sovellus.picothememanager android.permission.WRITE_SECURE_SETTINGS
   ```
3. 安装想要的自定义场景
4. 打开主题管理器应用，并应用自定义场景

可以到以下网站下载自定义场景：
+ ~~picoenvironmentarchive.ct.ws~~ (免费域名寄了)
+ [picoenvironmentarchive.github.io](https://picoenvironmentarchive.github.io/) (我的备份站)

也可以按照主题管理器[作者提供的教程](https://gist.github.com/Nyabsi/c14bd38d03d6dc44721779c182762627)来打包 Unity 场景。
