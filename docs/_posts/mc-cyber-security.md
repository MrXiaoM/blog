---
title: 关于 Minecraft 服务器安全防护建议
date: 2025-01-13 14:48:32
permalink: /post/mc-cyber-security
description: 开服两年以来的安全经验总结
categories: 
  - Minecraft
tags: 
  - 网络
sidebar: auto
---

DDoS 防护方面已在我的[上一篇博文](https://producer.mrxiaom.top/post/mc-ddos)中进行过讲解，在此不过多讲述。  
分享一个排除法：你可以额外租一些节点给一部分信得过的已付费玩家使用，在遭受攻击后，如果某些给付费玩家的节点出了问题，那么内鬼大概率就在这些玩家之中。

这篇博文主要讲讲在账号安全方面的一些建议，想到什么就写什么，可能有点乱。

## 远程桌面安全

尽量不使用默认的 3389 作为 Windows 远程桌面端口。如果你想起到简单的迷惑作用，Linux 将 `SSH` 端口改为 `3389`，Windows 将 `RDP` 远程桌面端口改为 `22` (笑)。

远程桌面是需要重点防护的对象之一，有以下情况会让黑客闻着味就来破解你的远程桌面
+ 国内或国外的黑客广撒网，扫描整个IP段的特殊端口是否开启
+ 特别的个人或团体，比如你服务器里的玩家，动歪心思试试有没有用
+ 有人看到你端口开着，闲着没事来看看

登录 RDP 或 SSH，需要两个要素，`用户名`和`密码`。黑客通常会尝试使用 `Administrator`、`root` 等默认用户名，使用来自世界各地的肉鸡来尝试暴力破解你的远程桌面。更有甚者，比如你的服务器玩家，可能还会尝试你(服务器管理员)的玩家名。

我的建议是，不要启用 `Administrator` 和 `root` 账户的远程登录权限。自己建一个账户，名字尽可能奇怪，给予自己管理员权限，使用这个账户来进行日常运维活动。

不要在服务器上运行来源不明的任何软件，包括服务端插件。

服务端核心应当运行在一个普通账户下，这个账户只有Java和服务端目录的权限，以免插件或服务端出现远程执行后门或漏洞时出现更大的损失。

黑客不知道你的账户名，那么他们暴力破解服务器远程桌面的难度就指数级增加了，即使知道你的远程桌面开在哪个端口，在有生之年内无法穷举出所有的用户名和密码组合。

说到密码，大厂的网络安全事故都层出不穷，有很多次密码泄露事件，所以建议不要使用你的社交账号密码作为远程桌面的密码。目前我服务器的远程密码是随机生成的，使用了包括但不限于字母、数字、特殊符号，长度保密。你问我怎么记住这个密码？我的建议是不记。我有一个远程桌面管理软件，可以管理 RDP 会话，数据存在本地，顺便放到了U盘和移动硬盘里进行备份，只要软件还在我的电脑上，我就能访问远程桌面。

推荐一个远程桌面防护工具，Windows 使用 [fail2ban-win](https://gitee.com/iamverygood/fail2ban-win)，Linux 使用 [fail2ban](https://github.com/fail2ban/fail2ban)，可以自动封禁尝试登录错误次数过多的 IP 地址。

## 防火墙安全

对于暴露在公网中的服务器，必须要开启防火墙，只对外开启必要的端口。以免有心人利用漏洞入侵服务器造成不必要的损失。

## 游戏密码

目前我服务器是群组服，使用 Waterfall 作群组核心，禁用 Waterfall 的所有命令和权限，在登录服安装 AuthMeReloaded 作为登录插件。

登录插件有两种，一种是单个子服的，也就是在登录服安装登录插件，有个缺点就是玩太久之后突然回登录服会要求重新登录。  
另一种是装在群组核心的，你没通过登录验证就不能进行任何操作，这种形式更新、更好，还可以防止还没通过登录验证就传送出登录服的问题。
关于 BungeeCord 和 Velocity，我的建议是你习惯用哪个就用哪个，尽管 Paper 将 Velocity 吹得天花乱坠，但我并不习惯它的 toml 配置，以及我需要的插件没有 Velocity 版本，所以依然在用 BungeeCord。  
简单来说，因为我的个人习惯，以及目前架构 (BungeeCord+登录服+登录插件) 虽然过时，但已经相当稳定了，我没有必要冒这个风险去升级到 Velocity。稳定远比性能更重要。

说回登录密码。

为了方便起见，一般来说我们管理员在下线的时候是不会下自己的OP权限的，方便下次登录就能直接运用权限。  
这会有一个隐患，你(管理员)的账号密码有可能会被攻破，不管是暴力破解、熟人作案、黑客撞库等等，只要你的密码被破解了，拿到你密码的玩家想干什么就干什么。

当然，游戏肯定是要为登录方便而设置密码，要是实在不放心，你可以随机生成密码，然后用密码管理mod来自动登录。不过这又有了另一个隐患，你不能把你的客户端发给任何人，否则他们会知道你的密码。

最好的方法，也是目前我在使用的方法，就是二步验证(2FA)。

很多登录插件都支持二步验证，AuthMeReloaded 也支持，你只需要在你的手机或者电脑安装一个二步验证软件，然后在登录插件添加二步验证即可。  
每次登录，你都需要输入来自二步验证软件的六位验证码才能成功登录，即使别人知道你的密码也无法成功登录你的游戏账户。

## 玩家账号安全

写一点教程，推荐但不强制玩家做 绑定邮箱、添加二步验证 等以增加账号安全等级。  
但是，二步验证在玩家中有利有弊，弊端就是玩家的二步验证软件数据丢了以后，只能找管理员找回账号。

另外，开服期间注意到了一个现象，有的人会用软件强行霸占其它玩家的账号，不让号主登录，来做到软封禁的效果。  
软件因为登录超时未输入密码而被踢出后，会立即重新登录，避免其它人上号。  
为了避免这种情况的出现，我给我服务器的QQ机器人添加了一个功能，自助封禁自己账号的IP地址。  
我服务器的QQ机器人可以绑定自己的游戏账号到QQ号，所以想到可以这么做来避免上述情况的发生，只要有人敢这么做，那号主就可以封禁肇事者的 IP 地址，而不需要向管理员求助。

## 内容审查安全

一般来说，Minecraft 服务器是几乎不会有多少内容审查限制的。从大的来说，绝对不能碰的是涉政和涉黄，关于人身攻击以及其它的一些细则，则由各服务器自行规定。

你服务器的对头，或者想要打击报复服务器的玩家，通常会选择开小号在聊天里刷涉政和涉黄话题，作为管理员，你不一定能够24小时在线去管你的服务器聊天栏。

对这些功能设置一点门槛可能会有所帮助。比如我服务器就需要绑定QQ号或者进行正版验证，才能在聊天栏发送消息。对于想要游玩这个服务器的新人也相对友好，要么加群绑定QQ号，要么使用正版账号验证，都不是特别难的事。

## 管理员权限安全

我们通常是使用命令来做各个插件之间的互联互通。但是，从很久以前，就有一个非常不好的习惯。

那就是：使用OP权限(管理员权限)执行。

**永远都不要这么做！**

使用OP权限执行命令的原理如下
```
在玩家有OP权限时:
执行命令

在玩家没有OP权限时:
给予玩家OP权限 -> 执行命令 -> 还原玩家OP权限状态
```
最要命的就是`给予玩家OP权限`和`还原玩家OP权限状态`这两步。

这两步会在设置权限之后进行 IO 操作 (文件输入/输出操作)，将 OP 权限状态写入 `ops.json` 里。  
进行 IO 操作是相当耗时的，在高频执行时甚至会影响服务器性能。

这还没完，如果玩家发现了某个操作是通过“使用OP权限执行”的，他们可以通过脚本，一边执行这个操作一边执行一条命令，来卡出OP权限。  
此事在[二周目已经关服的生存都市亦有记载](https://www.bilibili.com/video/BV1ni4y1N7Ex/)，
只不过当时该武器修改物品lore (切换形态) 时没给OP权限，而是给的lore插件权限 (注意视频中的 `[GroupManagerLP]` 提示)，不然真的能卡出OP来。  
除了这种异步执行的方式，还能通过崩服bug，试图在“还原玩家OP权限状态”这一步，OP权限还没写进 `ops.json` 时让服务器崩溃，导致OP权限状态保留。

以上两种卡OP方法都非常依靠时机，虽然难，但是可行。

所以，绝对不要在你的服务器中使用“OP权限执行”这个功能，即使插件提供了这个功能。  
我可以这么说，**没有任何插件**的这个功能是安全的。而且这个功能还会造成额外的性能损耗。

使用控制台权限执行不需要写入OP权限状态，不仅安全，性能还比使用OP权限执行更高。

## 插件安全

不要使用任何来源不明的插件，包括刚发布不久的、低下载量的、玩家给你的、闭源的，甚至是付费插件。  
开源插件基本可信，只要不是用小号发的，基本不会有后门，除非作者在网上的名声不想要了。  
服务器管理团队里最好要有一名懂得编程的技术，在安装插件之前做简单的后门排查。  
除非有必要（比如漏洞修复、新增自己需要的功能什么的），特别是闭源的免费或付费插件，只要能用就尽量不更新插件，以免上游投毒。

## 尾声

我的网安老师跟我们说过，最好的安全措施，是即使你公开了出来也无法或难以破解的。  
欢迎各位读者借鉴我的方案，或者从我的方案中寻找漏洞、加以改进。
