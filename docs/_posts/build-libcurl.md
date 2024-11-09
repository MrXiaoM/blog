---
title: Windows 下编译 libcurl 全流程
date: 2024-11-09 16:47:04
permalink: /post/build-libcurl
description: 文档好多好杂，看不过来
categories:
  - C
tags:
  - C语言
  - Windows
---

## 前言

最近需要静态编译的 `libcurl.lib`，嵌入到我的 C++ 程序里面，但是好像发行版没有 `.lib` 提供，只能自己编译了。

curl 的文档又多又杂，读起来挺麻烦的，很多时候不知道该到哪里找文档。

## 准备

首先到 [curl 官网](https://curl.se/download.html) 下载源代码 (Source Archives)，解压到任意位置。

然后打开 Visual Studio 的开发者命令提示符，有以下几种方法可以打开
+ 使用 Windows Terminal（终端）打开
+ 在 Visual Studio 的 `工具(T) -> 命令行(L) -> 开发者命令提示(C)` 打开
+ 打开文件 `"C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat"`

打开之后 cd 到解压的 curl 源码目录下的 `winbuild` 目录，你也注意到这个目录下有个 `README.md` 文件，这是在 Windows 下编译 curl 的帮助文档。

注意，**使用开发者命令提示符**是很重要的一件事，否则你会找不到 `nmake` 命令。

## 编译

在**开发者命令提示符**执行以下命令即可编译 libcurl，注意一定要进入**开发者命令提示符**！
```shell
nmake /f Makefile.vc mode=static RTLIBCFG=static VC=17 MACHINE=x64 DEBUG=no
```

+ `mode=static` 相当于静态编译，生成 `.lib` 文件；反之使用 `mode=dll` 生成 `.dll` 文件。
+ `RTLIBCFG=static` 相当于链接时使用 `/MT` 或 `/MTd` 参数 (CRT 静态链接)。
+ `MACHINE` 可选 `x64`,`x86`,`arm64`。`DEBUG` 不解释。

VC 版本与 Visual Studio 版本对应关系如下
```
Visual Studio 2008, VC=9
Visual Studio 2010, VC=10
Visual Studio 2012, VC=11
Visual Studio 2013, VC=12
Visual Studio 2014, VC=13
Visual Studio 2015, VC=14
Visual Studio 2017, VC=15
Visual Studio 2019, VC=16
Visual Studio 2022, VC=17
```

编译后的文件会出现在
```shell
builds/libcurl-vc17-x64-release-static-ipv6-sspi-schannel/lib/libcurl_a.lib
```
配置不相同，目录也不相同，总之都在 `builds` 文件夹里。

如果需要添加 SSL 支持等等，请翻阅 `winbuild/README.md` 说明文件，我不需要，就不另外研究了。

## 在 Visual Studio 导入依赖

假如编译目录在 `builds/libcurl-vc17-x64-release-static-ipv6-sspi-schannel/`

在项目属性进行如下编辑（添加目录不用那么死板，也可以将文件夹复制到项目目录再操作）
+ 转到 `C/C++ -> 常规 -> 附加包含目录`，将编译目录中的 `include` 目录添加进去。
+ 转到 `C/C++ -> 预处理器 -> 预处理器定义`，添加一项 `CURL_STATICLIB`。
+ 转到 `链接器 -> 常规 -> 附加库目录`，将编译目录中的 `lib` 目录添加进去。
+ 转到 `链接器 -> 输入 -> 附加依赖项`，添加一项 `libcurl_a.lib`。
+ 转到 `链接器 -> 输入 -> 忽略特定默认库`，添加一项 `MSVCRT.lib`。

然后你就可以愉快地使用 libcurl 啦

```c
#include "curl/curl.h"
#pragma comment(lib, "libcurl_a.lib")

void main()
{
  CURL* curl;
  CURLcode res;
  curl_global_init(CURL_GLOBAL_DEFAULT);
  curl = curl_easy_init();
  if (curl) {
    curl_easy_setopt(curl, CURLOPT_URL, "http://127.0.0.1");
    // TODO: do what you want here.
    res = curl_easy_perform(curl);
    curl_easy_cleanup(curl);
  }
  curl_global_cleanup();
}
```
