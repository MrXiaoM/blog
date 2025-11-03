---
title: 使用 VRoid Studio 捏脸，导出 VRChat 模型
date: 2025-10-03 14:21:44
permalink: /post/vroid-to-vrchat
description: 踩坑
categories: 
  - 日常
tags: 
  - VR
  - VRChat
  - Unity
  - 模型
  - VRoid
sidebar: auto
---

[VRoid Studio](https://vroid.com/en/studio) 是 pixiv 家的一个免费捏脸工具。它的 CDN 超级超级慢，如果需要使用，更推荐在 [steam](https://store.steampowered.com/app/1486350/) 下载。

~~这个软件虽然没有官方中文，但是上手不难。~~ 现在的版本已经有 CJK（中日韩）的官方本地化支持了！使用预设的模型和贴图就足够制作一个简单的人物模型了。

只要你把所有选项都点了个遍，大致就知道这个软件怎么用了。

导出模型反而是个大坑，在这篇博文我将会介绍如何导出绿模。如果按[官方教程](https://vroid.pixiv.help/hc/en-us/articles/38728373457561)来操作，100% 是红模，毫无优化。

## 准备 VCC 环境

VRChat Companion Creator (VCC) 是上传 VRChat 模型的重要工具，你可以通过社区汉化的[文档](https://docs.vrczh.org/vcc.docs.vrchat.com/guides/getting-started)来找到安装教程。

要注意的是，VCC 只支持国际版 Unity 的特定版本编辑器，中国版 Unity 的版本号后面带 `c1`，VCC 是不认的。你可能需要 [NoUnityCN](https://www.nounitycn.top/unityhub) 以及带宽、流量足够大的 TUN 代理。因为国际版编辑器没有收录在中国版的服务器中，直接下载编辑器会因为重定向造成 404 未找到。

## 导出模型

在 `VRoid Editing` 那里编辑好你的模型之后，点击右上角的上传按钮，点击 `Export as VRM`，然后调整参数。

最重要的是材质合并，在 `Reduce Materials` 那里，将 `Materials` 拉满 (`12`)，将 `Texture Atlas Resolution` 调到最低 (`2048x2048`)。

右上角会显示导出详情，如果你想进一步优化，减少多边形数量，可以拉一下 `Reduce Ploygons` 里面的滑块。

需要注意的是，你需要保证最终 `Polygons` 的值小于 `65535`，推荐在 `32000` 左右最为合适。

都调整好之后，点击 `Export` 导出，选择 `VRM 0.0`，填写名字和作者，其它的不用填，直接导出。

![](https://pic1.imgdb.cn/item/68df6eabc5157e1a885303a6.png)

## 创建项目

::: tip 提示
建议全程开 TUN。
:::

在第一步，安装好 VCC，以及使用 VCC 安装好 Unity Editor 之后，到 `Settings` -> `Packages` 点击 `Add Repository`，添加以下插件仓库
+ `https://vpm.thry.dev/index.json`
+ `https://esperecyan.github.io/VRMConverterForVRChat/registry.json`
+ `https://xtlcdn.github.io/vpm/index.json`

然后回到 `Projects`，点击 `Create New Project` 新建项目，项目模板选择 `Unity 2022 Avatar Project` 并新建项目。

新建完成后，会弹出选择安装插件 (`Manage Packages`) 的界面，依次安装以下插件
+ `Thry's Avatar Performance Tools` 性能测试工具 (可选)
+ `VRM Converter for VRChat` VRM 模型转换器
+ `Ava Utils` 模型优化工具

这三个插件都对应了之前添加的三个插件仓库，如果某一个无法访问，这里哪个就不会显示在可安装列表里。

装完之后点击 `Open Project`，在 Unity Editor 中打开项目。

打开后的第一件事，先把场景给保存了，按 Ctrl+S，将场景保存的项目的 Assets 目录里（可以随便起名）。

## 导入模型

::: tip 提示
以下操作，如果你没找到选项，请自查是不是插件没装好。
:::

可以参考 [VRM Converter for VRChat 的文档](https://qiita.com/100/items/7315fe3a7eb75732ae43)，虽然它是用于 VRChat SDK 2.0 的教程，但也适用于 3.0。

在工具栏点击 `VRM0 -> Import VRM 0.x...`，选择你在第二步导出的 `.vrm` 模型文件，然后会弹窗让你保存 `.prefab` 文件。

在 `Assets` 文件夹里新建一个文件夹，随便起名，用英文数字就行（例如 `MyAvatar`），将你的 `.prefab` 文件保存进去。等待一会转换完成后，你的模型就成功导入到 Unity Editor 了。

选中你刚刚保存的 `.prefab` 文件，点击 `VRM0 -> Duplicate and Convert for VRChat`，然后在弹出的对话框，
+ Swaying Objects 选择 `Remove Swaying Objects`

再点击 `Duplicate and Convert` 并保存到一个新的 `.prefab` 文件。

将刚刚保存的 prefab 拖动到场景（左上角）中，在工具栏点击 `VRChat SDK -> Show Control Panel`，然后拖到右边把这个窗口给固定好，登录你的 VRChat 账号。场景中在你的 prefab 被选中的情况下，切换到 Builder 选项卡点击 `Add a VRCAvatarDescriptor`。

然后你可以在 `Review Any Alerts` 看到模型当前存在的问题。

![](https://pic1.imgdb.cn/item/68e3799ec5157e1a8859ba0d.png)

## 优化模型

通常来说，用这个方法导入的模型基本不会有性能问题，只要你上一步的 Swaying Objects 没有保留那些骨骼数据。

如果你的设备没有眼部追踪，可以在场景中选中你的 prefab，在检查器那里，`VRC Avatar Descriptor` 下面把 `Eye Look` 关掉，否则你的模型眼球位置可能会不正常。

## 上传

VRChat 要求你的账号的信誉等级至少达到蓝色 `萌新(New User)` 才能构建以及上传模型。可以搜索 [VRChat 信誉等级](https://cn.bing.com/search?q=vrchat%20%E4%BF%A1%E8%AA%89%E7%AD%89%E7%BA%A7) 之类的关键词寻找相关攻略。

简单来说，上游戏先换一个公共模型，在游戏里多到**公共房**社交 (互动、聊天、语音) 就能提高信誉等级。

在获得 `萌新(New User)` 信誉等级之后，VRChat 会发一封邮件给你  
![](https://pic1.imgdb.cn/item/68e353fec5157e1a88599ff4.png)

为方便参考，我大约在 PC 玩了两个小时，在 VR 玩了两个小时，只开过两三次麦克风，steam 统计总共 5.4 小时，就达到了萌新等级。

上传就没什么好说的了，在之前提到的 `Review Any Alerts` 上面有个 `Prepare Your Content`，在里面输入信息，然后再在最后面的 `Build` 进行构建就行了。上传模型需要开 TUN，或者可以安装 [VRChat SDK Patcher](https://docs.vrcd.org.cn/books/all-about-vrchat-sdk-patcher) 来使用系统代理。

如果你的模型多边形数量超过 7500、材质槽位超过 2，不推荐勾选 Android 和 iOS 平台。
