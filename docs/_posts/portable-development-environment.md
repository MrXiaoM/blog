---
title: 便携式可移动开发环境的搭建
date: 2025-08-26 18:47:54
permalink: /post/portable-development-environment
description: 电脑坏了之后，打算以后施行的开发方案
categories: 
  - 日常
tags: 
  - 网站
  - vuepress
sidebar: auto
---

在开头，首先避雷**天猫国际自营店**。我的旧笔记本是从天猫国际自营店买的，是正品没错，一年后出问题了才知道是尾货，华硕笔记本保修按生产日期开始算，刚到货即保修到期。它在我早上起床开机大约一个小时后毫无征兆的情况下发出打火的声音、黑屏关机、发出糊味，当时没有跑高耗能的程序。

从此刻开始，我不再相信任何高性能笔记本，只要是液金就有漏的风险，笔记本只要能便捷办公就足够了，不要奢求拿来玩游戏。在这么个有功耗限制和散热限制的平台上玩游戏，纯给自己添堵。

好在硬盘没事，买了个 M.2 硬盘盒把数据复制出来了，旧笔记本估计也就屏幕和剩的硬盘还有用，有空再去处理它。

经过这次数据转移，我逐渐意识到，复制开发项目是相当累的一件事。一些项目由很多的小文件组成，所有项目加起来总共上百万个文件，硬盘带宽再大，拷贝起来也非常耗时。

所以我打算，把我的移动硬盘里上百G的冷数据传到百度网盘，把地方腾出来，放开发项目。

## 移动硬盘

我的移动硬盘是使用 SATA 硬盘盒，加上几年前买的七彩虹 `SL500 512GB`，通电六千多小时，健康度 `97%`。比较低配的一个固态，我家里店铺的机械硬盘快不行了也是换的这个型号。

我往里面安装了 `FirPE` 作为平时维护电脑使用的工具，修改了 PE 的壁纸，并在 PE 启动后弹出一个自己写的 C 程序，用于引导用户执行重装系统等操作（主要是看起来酷）。硬盘中还放入了 Windows 11、Windows 10、CentOS、Ubuntu 的 ISO 镜像。

![](https://pic1.imgdb.cn/item/68ad97cf58cb8da5c852a421.png)

除此之外，我的移动硬盘还会存一些安装包，方便重装系统后进行数字权利激活、安装 Adobe 全家桶、安装驱动、安装运行库等等。一些常用工具例如 Navicat 的安装包以及 Keygen 也会包含在其中。

我的台式电脑（在家里用）主板比较拉跨，只有 `USB 2.0` 接口，在任务管理器看硬盘占用，最高能达到大约 `20MB/s` 的读取速度，也算能凑合着用了。我的新的笔记本（在学校用）有 `USB 3.0` 接口，使用起来会好很多。

## 开发环境搭建

首先我在移动硬盘上新建一个目录 `.development`，在最前面加 `.` 是为了能够让它显示在最前面。

由于我的习惯是将所有从 Github 拉取的仓库存到 `D:\Github` 里面，所以再在 `.development` 里新建两个文件夹
+ `Github` -- 从 Github 拉取的仓库
+ `Sweet` -- 同上，只不过是我比较常用的仓库

将原来的项目全部复制进去，这一部分就这么简单。

但是，光有项目是没有什么意义的，Gradle 缓存、本地 Maven 仓库也要移到移动硬盘上才行，不然一换电脑打开项目，就要等好久处理依赖。

我的方案是使用 Maven 配置配合环境变量，将以下文件放到 `.development` 文件夹，然后以管理员权限执行 `link.cmd` 即可
+ 将 Gradle 缓存目录改到 `移动硬盘:\.development\data\gradle`
+ 将 Maven 本地仓库改到 `移动硬盘:\.development\data\repository`
+ (如有必要，可以复制现有的缓存目录、本地仓库到新的路径)

:::: tabs
::: tab link.cmd

```bat
@echo off
cd /d %~dp0
echo.
echo.  User Profile Directory: "%USERPROFILE%\.m2"
echo.  Working Directory: "%cd%"
echo.  Gradle Cache: "%cd%\data\gradle"
echo.  Maven Local Repository: "%cd%\data\repository"
echo.
net.exe session 1>NUL 2>NUL && ( goto as_admin ) || ( goto not_admin )
exit

:not_admin
echo.  [ PLEASE RUN AS ADMINISTRATOR ]
pause>nul
exit

:as_admin
echo.  [ Press any key to apply changes ]
pause>nul
echo.
setx "GRADLE_USER_HOME" "%cd%\data\gradle" /M
setx "MAVEN_LOCAL_REPOSITORY" "%cd%\data\repository" /M
copy /Y "%cd%\data\settings.xml" "%USERPROFILE%\.m2\settings.xml"
echo.
echo.  Done. You can close this window now.
pause>nul
exit

```

:::
::: tab data/settings.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>

<settings xmlns="http://maven.apache.org/SETTINGS/1.2.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.2.0 https://maven.apache.org/xsd/settings-1.2.0.xsd">
  <localRepository>${env.MAVEN_LOCAL_REPOSITORY}</localRepository>

  <mirrors>
    <mirror>
      <id>maven-default-http-blocker</id>
      <mirrorOf>external:http:*</mirrorOf>
      <name>Pseudo repository to mirror external repositories initially using HTTP.</name>
      <url>http://0.0.0.0/</url>
      <blocked>true</blocked>
    </mirror>
  </mirrors>

</settings>
```

:::
::::

另外，如果你需要使用 Git，还需要在全局设置配置文件 `C:/Users/用户名/.gitconfig` 添加以下内容：
```
[safe]
    directory = *
```
简单来说，就是让 Git 别多管闲事，不属于当前用户的文件夹也是安全的。

## 其它实用工具

之前用的 Xshell 个人家庭/学校免费版，结果就是不破解就每隔几个月要强制更新，会话也不方便转移，麻烦得很。

所以我很多软件都换了便携版的软件，放到移动硬盘里方便 在家里 和 在学校 使用。总目标是在电脑出问题时，能够快速恢复生产能力。

目前我的移动硬盘里存有以下工具，都是便携版，需要的时候可以直接打开使用，无需安装
+ [WindTerm](https://github.com/kingToolbox/WindTerm/releases) -- ssh 连接工具，除了不能自定义布局以外，比较优秀的便携 ssh 客户端软件
+ [mRemoteNG](https://github.com/mRemoteNG/mRemoteNG/releases) -- RDP 连接工具，在窗口上不显示地址，适合直播时需要上远程桌面调试使用
+ [Motrix](https://motrix.app/zh-CN/) -- 我心中最好的桌面平台下载工具，留一份便携版到移动硬盘里以便不时之需
+ [Drive-Icon-Manager](https://github.com/Return-Log/Drive-Icon-Manager/releases)、[MyComputerManager](https://github.com/1357310795/MyComputerManager/releases) -- “此电脑”图标编辑工具，用来删掉某些国产流氓软件拉的史
+ [rufus](https://rufus.ie/zh) -- U盘低级格式化工具，虽然 PE 里有，但还是想留一份便携版在移动硬盘里
+ [Paint.NET](https://github.com/paintdotnet/release/releases/latest) -- 我最常用的图片处理工具，留一份便携版到移动硬盘里以备不时之需

## 不方便随身携带的其它软件

列个软件清单，省得我电脑再出问题时，需要找半天软件下载地址

**较高优先级**
+ [火绒安全软件](https://www.huorong.cn/person)
+ [QQ](https://im.qq.com/pcqq/index.shtml)
+ [微信](https://pc.weixin.qq.com/)
+ [企业微信](https://work.weixin.qq.com/#indexDownload)
+ [PeaZip 压缩软件](https://peazip.github.io/peazip-64bit.html)
+ [PotPlayer 播放器](https://potplayer.org/category-3.html)

**较低优先级**
+ [Steam](https://store.steampowered.com/about/)
+ [utools](https://www.u-tools.cn/download/)
+ [Github Desktop](https://desktop.github.com/download/)
+ [Git for Windows](https://gitforwindows.org/)
+ [Liberica JDK](http://bell-sw.com/pages/downloads)
+ [IntelliJ IDEA Community](https://www.jetbrains.com/zh-cn/idea/download/#community-edition)
