---
title: PICO 4 从旧系统 5.4.0 升级的折腾记录
date: 2026-05-23 23:44:52
permalink: /post/pico-4-upgrade-guide
description: 升级条件较为苛刻，分享一下我踩过的坑
categories: 
  - 日常
tags: 
  - PICO
  - VR
  - 升级
sidebar: auto
---

最近在某鱼 ￥1800 收了一台 PICO 4，配置是 8+128G，据卖家描述无法升级系统。

很快啊，第二天就到货了。配件齐全，有主机、俩手柄、充电器、收纳包，再额外买个面罩或者鼻托就齐活了。简单测试功能基本完好，只是手柄电量不太够，要买点电池备用。

PICO OS 开启开发者模式的方式就不多说了，所有 Android 衍生系统都一样，连续点击软件版本出现开发者模式选项，最重要的是把 USB 调试和文件传输开了。

## 前期过程

我早早就下载好了最新版系统离线包，拷贝到机器里面升级，提示 “检测到安装包不适用当前系统”。

![](https://static.mcio.dev/legacy/6a119d776211f5ac19ec36cd.webp)

从关于页面可以看出来，系统的版本是 `5.4.0`，我去查了一下，`5.4.0` 已经是 **2023年2月** 的系统了。而版本号上显示的更早，从版本号中间的日期能看出来 **2023年1月**，所以我猜测：
> 也许是新的离线包格式（或者签名）旧系统已经不认识了，那就试试逐步升级，找不同版本的离线包做跳板。
>
> 后面研究证实，我当时的猜测是错的。但这也是折腾的一部分，就留着。

旧版本更新包很好找，至少在我发布文章这一刻，PICO 实际上并没有删除历史的离线包，依然可以从官网上下载，只不过下载地址要到时光机去找。

> 这里的下载地址不重要，我就不提供了，接着往下看吧。

离线升级的操作步骤在[官方文档](https://developer-cn.picoxr.com/document/unity/offline-upgrade-device-system-version/)亦有记载：
> 若你需要离线升级 PICO Neo3 系列、PICO 4 系列和 PICO 4 Ultra 系列设备的系统版本，使用以下步骤：
> 1. 使用 USB 数据线连接 PICO 设备和 PC。
> 2. 在 PICO 设备的系统根目录下新建 “dload” 文件夹。
> 3. 从[此网站](https://www.picoxr.com/cn/software/pico-os)下载最新版本的 PICO OS 文件包。
> 4. 将 OS 文件包（切勿解压）拷贝至 “dload” 文件夹。
> 5. 断开 PICO 设备的网络连接。
> 6. 前往 **设置 > 系统升级 > 离线升级**，然后升级设备系统版本。

另外，我在[旧版本文档](https://developer-cn.picoxr.com/document/unity/offline-upgrade-device-system-version/?v=2.5.0)找到了以下描述，看文档的提交时间，这个规则应该适用于 5.11.0 以前：
> 5. 若离线升级失败，为 OS 文件包名添加相应的前缀然后再次尝试离线升级。
>   - 若为 PICO 4 系列设备，则添加 “update_Pico4_” 前缀。例如：update_Pico4_5.7.2-202301032204-RELEASE-user-neo3-b2760-35084bb960.zip。

既然存在这个描述的话，那我先按版本命名格式进行分界，打算先下载 `5.9.2` 看看能不能升级。我才刚拿到这台机子，~~怕系统升级真的因为格式变化而产生什么漏洞，不敢冒险直接升最新版~~。
> 我的担忧是没有必要的，最终我一步到位升级到了本文发布时的最新版系统 `5.13.7`。

## OEM 机器

我在时光机能找到的最低版本是 `5.6.0`，尝试了也还是相同的提示  “检测到安装包不适用当前系统”。

于是我发现我的思路可能是不正确的，于是四处去找资料。但实际上，pico 刷机资料是非常之少的，我只能从零星的几篇国内国外的帖子里找到一些比较基础的资料。

后来发现，PICO OS 分为 `OEM` 和 `non-OEM` 两种类型，两种系统不通用，这也是离线升级页面显示“不适用当前系统”的主要原因。

通过网上搜寻的资料，可以使用 ADB Shell 命令来判断当前设备是否为 OEM 机器：
```shell
adb shell getprop ro.oem.state
```
如果出现 `true`，则代表当前机器是 OEM 机器，如果出现空白结果，则代表当前机器是非 OEM 机器。在我这里的结果是返回了空字符串，所以我买到的是非 OEM 机器。

我去 owo 大佬的[网站](https://owomushi.com/Pico-4-Archive/)下载了国区的非 OEM 更新包，安全起见，我选择了跟我当前系统相同版本的 `5.4.0` 非 OEM 更新包。

拷贝到头显里面之后，貌似终于可以升级了，点击离线升级之后会提示重启（我没截图）。

但是！但是！进度条才走了几秒就报错了，停留在了 recovery 模式，显示以下报错日志

![](https://static.mcio.dev/legacy/6a119ec76211f5ac19ec36e9.webp)

是的，签名校验失败。我就纳闷了，owo 大佬的网站提供的国区更新包都是转跳 PICO 官网下载的，怎么会签名校验失败呢？

## 开发版系统

我在刚拍摄版本号截图发到我群里的时候，有群友提了一句
> 真假 userdebug？那不直接 adb root

当时我没太当回事，有 root 权限好像也没什么意义。

直到我跑到签名校验失败这一步，我是真没招了，去问了下 Claude：
> (上述截图的报错)
> ...  
> 关于系统中的软件版本号带有 userdebug 结尾，并且也可以通过 adb root 取得 root shell，我该如何将系统更新到最新官方系统？  

得到的回答是
> 你当前的系统是 userdebug 版本（通常带有测试签名或开发签名），而你下载的官方离线包是 user 版本（带有官方正式发布签名）。  
> ...  
> 方法三：修改 Recovery 绕过签名验证（高阶）  
> ...  

说到这个我就不困了，Claude 说签名校验在 Recovery 里面，那我又有带 root 权限的 ADB Shell，设备又没有 A/B 分区，那不是随便刷吗？

## 刷入正式版 Recovery

Claude 给了我解包 Recovery 并修改其中的系统签名的方法，但是我觉得风险太大了。

俺寻思 Recovery 应该通用的吧，PICO 4 系统更新包里面有一个完整的 `recovery.img` 文件，也许我可以刷个正式版的 Recovery 进去试试。

那就开干！首先备份原有的 Recovery：
```shell
adb root
adb shell

dd if=/dev/block/by-name/recovery of=/sdcard/pico_recovery.bak.img
exit
```
```shell
adb pull /sdcard/pico_recovery.bak.img
```
然后将 `5.4.0` 官方更新包的 `recovery.img` 解压到 ADB 所在目录，然后刷进去：
```shell
adb root
adb push recovery.img /sdcard/
adb shell

dd if=/sdcard/recovery.img of=/dev/block/by-name/recovery
sync
exit
```
再将 `5.4.0` 官方更新包拷贝到内部储存空间下的 `dload` 目录，去离线更新，就能刷进去了！

刷完之后，直接联网并进入系统更新页面，就能看到最新系统推送了。

![](https://static.mcio.dev/legacy/6a11a1f66211f5ac19ec376e.webp)

最后也是美美解决了原机器无法升级系统的问题，从 `5.4.0` 一步升级到了最新版 `5.13.7`。

![](https://static.mcio.dev/legacy/6a11a1f66211f5ac19ec376d.webp)

## 后续优化

### 关闭开机推荐
```shell
adb shell pm uninstall --user 0 com.pvr.home
```

### 添加自定义场景

使用开源项目 [PicoThemeManager](https://github.com/Nyabsi/PicoThemeManager) 来修改自定义场景
1. 下载并安装 [PicoThemeManager.apk](https://github.com/Nyabsi/PicoThemeManager/releases)
2. 在 ADB 授予权限：
   ```shell
   adb shell pm grant cc.sovellus.picothememanager android.permission.WRITE_SECURE_SETTINGS
   ```
3. 安装想要的自定义场景

本来可以到 picoenvironmentarchive.ct.ws 下载自定义场景的，但是它的 DNS 好像炸了，全球 DNS 都解析不上去。毕竟 ct.ws 是个免费域名，不能要求太多。我查询 [DNS 历史记录](https://whoisfreaks.com/tools/dns/history/lookup/picoenvironmentarchive.ct.ws?type=all&page=1) 重新连上了这个网站，并尝试将上面的资源拉了下来，备份到了一个 Github 仓库里面，如有需要，可以在[我的备份站](https://picoenvironmentarchive.github.io/)上面下载。

我比较喜欢 Steam VR 的背景，主题 ID 是 `65`，在备份站搜一下就出来了。

我的备份站仅备份了主题列表，没备份具体资源。具体资源在 netlify 上面，相对来说安全。之后有空我再把这些资源下载全部下来备份，毕竟从 netlify 下载真的是 太 慢 了。

## 疑惑

在查资料的时候，我没有找到任何带有 `_userdebug` 的 PICO OS 资源，不知道这个开发版系统是哪里流出来的。

不过看到构建号是 `b0`，也可能是前机主或者前前机主自己改的系统。

## 参考链接

+ [百度贴吧 pico吧 - pico4离线升级，未检测到升级包](https://tieba.baidu.com/p/8247629288)
+ [OwoMushi - PICO 4 Firmware Archive](https://owomushi.com/Pico-4-Archive/)
+ [Reddit r/PicoXR - Pico 4 is still on 5.6.0](https://www.reddit.com/r/PicoXR/comments/15z5cwp/pico_4_is_still_on_560/)
