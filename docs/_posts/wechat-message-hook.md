---
title: 关于实时接收PC微信消息的研究
date: 2024-10-06 21:21:43
permalink: /post/wechat-message-hook
description: 从前人的研究入手，尝试实现读取微信接收消息
categories: 
  - 逆向
tags: 
  - 微信
  - WeChat
  - Hook
sidebar: auto
---

## 前言

我最近有读取自己的个人收款记录的需求，整理成 csv 表格，让程序对数据进行处理，实现生成报表、分析数据等等需求。

奈何微信的「账单」功能还是太简单了，如果我想做，这得一个一个数据输入进去，太麻烦了。我有 24 小时运行的 Windows 服务器，于是就在想，能不能在服务器上登录我的微信小号，然后设置店员为我的小号，这样我的小号就能收到我的所有收款消息了。只要写一个 hook 读取就行了。

## 开始研究

由于我个人逆向经验很少，于是我决定先找几个前人做过的 Hook 研究看看。

我研究的是开源的 [lich0821/WeChatFerry](https://github.com/lich0821/WeChatFerry)。使用 win32 api 给微信进程挂载 dll，使用 MinHook 注入到`接收消息`部分，监听微信的消息接收。

我首先做的是把项目拉下来，只留 WeChatFerry 文件夹里面的 Visual Studio 项目，并且把里面能砍的东西都砍了，只剩下 com（公共模块）、sdk（注入器）和 spy（挂载到微信的dll）。

为什么我不直接使用 WeChatFerry 呢？首先，我并不需要这么多功能，我只需要一个`监听微信消息`就可以做到我需要的记账功能了。

我花了几天的时间，大致研究明白微信 Hook 是如何工作的了。

> 免责声明: 本文仅为个人研究记录，仅供学习研究，请勿用于非法用途。

## 原理解析

WeChatFerry 作者在他的[微信公众号](https://mp.weixin.qq.com/s/CGLfSaNDy8MyuyPWGjGJ7w)发过原理，在此就不多表述，讲一点我自己的理解。

我以前听说过 C/C++ 难写，现在上手之后，不是一般的难写。光是导入静态依赖就用了我很长时间，我想要的 curl 在 nuget 上没有，只能自己编译，编译之后出现了很多问题也只能自己解决。

我把 sdk 改名为了 injector，它负责找到微信的进程，找不到时启动
```cpp
bool firstOpen = true;
int status  = 0;
DWORD wcPid = 0;

status = GetDllPath(debug, spyDllPath);
if (status != 0) {
    return status;
}
LOG_INFO("[WxInitInject] 已找到 spy.dll 路径: {}", Wstring2String(spyDllPath));
status = OpenWeChat(&wcPid, &firstOpen);
if (status != 0) {
    LOG_WARN("[WxInitInject] 微信打开失败");
    MessageBox(NULL, L"打开微信失败", L"WxInitSDK", 0);
    return status;
}
LOG_INFO("微信 PID: {}", to_string(wcPid));
if (!IsProcessX64(wcPid)) {
    LOG_WARN("[WxInitInject] 只支持 64 位微信");
    MessageBox(NULL, L"只支持 64 位微信", L"WxInitSDK", 0);
    return -1;
}
if (firstOpen) {
    LOG_INFO("[WxInitInject] 等待微信启动");
    Sleep(2000);
}
```
然后把 DLL 注入到微信，
```cpp
wcProcess = InjectDll(wcPid, spyDllPath, &spyBase);
if (wcProcess == NULL) {
    LOG_WARN("[WxInitInject] 注入失败");
    MessageBox(NULL, L"注入失败", L"WxInitSDK", 0);
    return -1;
}
```
并且调用其中的“注入主函数”，使用 MinHook 注入方法到指定的位置。
```cpp
PortPath_t pp = { 0 };
pp.port = 8081;
sprintf_s(pp.path, MAX_PATH, "%s", std::filesystem::current_path().string().c_str());
if (!CallDllFuncEx(wcProcess, spyDllPath, spyBase, "InitSpy", (LPVOID)&pp, sizeof(PortPath_t), NULL)) {
    LOG_WARN("[WxInitInject] 初始化失败");
    MessageBox(NULL, L"初始化失败", L"WxInitSDK", 0);
    return -1;
}
LOG_INFO("注入完成!");
```
InitSpy 是 `spy.dll` 中的方法，它会初始化 logger，将它的日志输出到 injector 所在目录下的文件，检查微信版本是否支持，然后注入。
```cpp
void InitSpy(LPVOID args)
{
    wchar_t version[16] = { 0 };
    PortPath_t *pp      = (PortPath_t *)args;
    string path = pp->path;
    InitLogger("WCF", path + "/logs/wcf.log");
    g_WeChatWinDllAddr = (UINT64)GetModuleHandle(L"WeChatWin.dll"); // 获取 WeChatWin 模块地址
    if (g_WeChatWinDllAddr == 0) {
        LOG_ERROR("获取 WeChatWin.dll 模块地址失败");
        return; // TODO: 退出进程，避免后面操作失败
    }
    if (!GetWeChatVersion(version)) { // 获取微信版本
        LOG_ERROR("获取微信版本失败");
        return;
    }
    LOG_INFO("WeChat version: {}", Wstring2String(version).c_str());
    if (!IsWxVersionMatched(version)) {
        LOG_ERROR("不支持当前版本");
        return;
    }
    ListenMessage();
    LOG_INFO("注入成功");
}
```
上述的 `ListenMessage();` 是通过 MinHook 注入到微信指定位置的逻辑，在 `receive_msg.cpp` 中
```cpp
void ListenMessage()
{
    MH_STATUS status = MH_UNKNOWN;
    if (gIsListening) {
        LOG_WARN("gIsListening");
        return;
    }
    funcRecvMsg = (RecvMsg_t)(g_WeChatWinDllAddr + OS_RECV_MSG_CALL);

    status = InitializeHook();
    if (status != MH_OK) {
        LOG_ERROR("MH_Initialize failed: {}", to_string(status));
        return;
    }

    status = MH_CreateHook(funcRecvMsg, &DispatchMsg, reinterpret_cast<LPVOID *>(&realRecvMsg));
    if (status != MH_OK) {
        LOG_ERROR("MH_CreateHook failed: {}", to_string(status));
        return;
    }

    status = MH_EnableHook(funcRecvMsg);
    if (status != MH_OK) {
        LOG_ERROR("MH_EnableHook failed: {}", to_string(status));
        return;
    }

    gIsListening = true;
}
```
注入到 WeChatWin.dll 地址相对的 `OS_RECV_MSG_CALL` 地址 (在 `receve_msg.cpp` 中规定了是 `0x2205510`)，  
初始化 Hook，新建 Hook，并启用 Hook。  
完成后，当微信接收到消息时，会转而去执行 `DispatchMsg` 函数，  
与 WeChatFerry 一样，在这个函数的结尾会执行 `realRecvMsg` 函数，即微信原本的接收消息函数，以维持微信正常运行。

原理就是这么个原理，难点在于如何定位“接收消息”函数在哪里。

## 静态分析

正如上文所说的，我个人逆向经验很少，以下是按照 WeChatFerry 中提供的地址进行定位找特征的。WeChatFerry 基于微信 3.9.10.27 开发，所以这里我们先射箭后画靶分析一波该如何找到这个函数的特征。

让我们打开 ida，对 `WeChatWin.dll` 进行完整分析（大概需要几小时）。

先“搜索”一遍“文本” `AppMsgMgr::OnSyncAppMsgAdd`（查找所有事件），等待搜索结果出来，让东西都加载得差不多。

然后“转跳”，“转跳到名称” `aAppmsgmgrOnsyn`，也就是字符串 `"AppMsgMgr::OnSyncAppMsgAdd"` 的常量默认名称，

![](https://pic.imgdb.cn/item/67024ffed29ded1a8c132760.png)

右键它，点击“交叉引用列表”，有两个结果，

![](https://pic.imgdb.cn/item/67025091d29ded1a8c13aa69.png)

两个是在同一个函数里的，任选一个点进它所在的函数，往上翻到函数名为止（这里是 `sub_18219AEB0`），然后右键这个函数，点击“交叉引用列表”，里面只有一个结果，  
点进去，就是接收消息的函数了。

![](https://pic.imgdb.cn/item/67025118d29ded1a8c141727.png)

按 F5 生成伪代码，往下翻，在函数开头往下一点点的地方能找到字符串 `"notifymessage"`，以及它下面有一行 `某某 = 13;` 或 `某某 = 13i64;` 就代表找对了。

![](https://pic.imgdb.cn/item/670251c0d29ded1a8c14ead5.png)

函数名一般包含了地址，格式为 `sub_地址`，这里是 `sub_182205510`。还要减去文件开头 HEADER 地址 `0000000180000000` 才是这个函数的地址，也就是 `0x2205510` 了。

定位到函数还不够，还要定位各个参数的相对地址，不然只能监听，不能读取，没什么用。

首先我们要找到基址是哪个参数，如上图有两个参数，而旧版本微信只有一个参数。鼠标点击它，点击哪个，开头的 if 及附近有变量高亮了，它就是基址。先右键，`Rename lvar` 将它改名为 `baseAddress` 记一下。

接下来，看看这个 `baseAddress` 都用在哪了，跟它有加减关系的常数全部都右键，点击 `Hexadecimal` 将它们转换为十六进制以便之后使用。如果它作为函数参数传进其它函数里面了，也要点进那个函数，将相应参数改名为 `baseAddress`，重复上述操作。

根据 WeChatFerry 给出的点位，在相应地址附近写注释，大概就如下图所示。

![](https://pic.imgdb.cn/item/67025e18d29ded1a8c1fff40.png)

(参数接入点2的注释应该是 `altAddress = bassAddress + 0x1C0`，改图麻烦，就懒得改了)

我们假设新版本微信没做多少变更，用上面的方法，反汇编分析本文完成时最新版微信 (3.9.12.17) 的 `WeChatWin.dll`，来到这个函数，看看有什么对的上的。

经过比对，微信 3.9.12.17 只有接收消息函数变成了 `sub_182141E80`，即地址 `0x2141E80`，参数的相对地址没有改变，如需升级到这个版本，只需要改 Hook 函数地址即可。

## 成果

最终修改完成的 Hook 发布在我的 Github: [MrXiaoM/WeChatMessages](https://github.com/MrXiaoM/WeChatMessages)

原本 WeChatFerry 的 rpc 我扬了，用不惯 proto，改成了序列化成 json 后用 libcurl 向某个地址发 http post，更符合我自己的风格。

![](https://pic.imgdb.cn/item/67028e7ad29ded1a8c4dc63b.png)
