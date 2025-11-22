---
title: 将你的闲置手机变成麦克风
date: 2024-11-23 00:27:15
permalink: /post/turn-your-phone-into-microphone
description: 手机音质也是挺好的，省一点钱
categories: 
  - 日常
tags:
  - 麦克风
  - Windows
  - Android
sidebar: auto
---

旧手机运行主流软件基本可以不用想了，所以把它当做麦克风也许是个很好的选择。

## 付费软件

+ [WO Mic](https://wolicheng.com/womic/) `$12.99`，有免费版，免费版会限制音量
+ [DroidCam](https://droidcam.app/) 有点太重了

以下会讲开源方案。

## 开源方案

我的方案是使用 [AndroidMic](https://github.com/teamclouday/AndroidMic/releases) + [VB-Cable](https://vb-audio.com/Cable/)，前者负责将手机录音传到电脑，并通过指定扬声器播放；后者负责将虚拟扬声器的声音传递到虚拟麦克风。

安装完成后，在电脑打开 AndroidMic 软件，将音频设备改为 `CABLE Input (VB-Audio Virtual Cable)`，然后想办法连接到手机的 AndroidMic 即可。

当软件左下方的框出现波形，即代表连接成功，将麦克风改为 `CABLE Output` 即可使用。

没有了。
