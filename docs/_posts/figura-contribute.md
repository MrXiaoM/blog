---
title: FiguraLambda 的版本兼容说明
date: 2025-01-26 02:02:53
permalink: /post/figura-contribute
description: 
categories:
  - Minecraft
tags:
  - 我的世界
  - Minecraft
  - Mod
  - Forge
  - Fabric
  - NeoForged
---

仓库：https://github.com/MrXiaoM/FiguraLambda

> 仓库中除了 1.20.4 外，其它版本仅保证可以编译，未进行测试，不保证能正常使用，请自行尝试。

由于本人精力有限，只维护 `1.20.4` 分支。其它分支可以创建 Pull Request，将 1.20.4 的变更合并进去。

首先确定你需要哪个分支，这里以 `1.20.6` 举例。

下面这个网站，将 `${branch}` 替换成你需要的分支 (`1.20.6`) 后访问。
```
https://github.com/MrXiaoM/FiguraLambda/compare/${branch}...MrXiaoM:FiguraLambda:1.20.4
```

主要是看看有没有什么奇怪的 commits 混进去了，确保页面中显示的所有提交都是 MrXiaoM，总之不是来自 Figura 官方的提交。

> 如果有条件的话，应该遵守就近原则，不要一下跳一个大版本，比如从 1.20.4 直接到 1.21.4，或者从 1.20.4 直接到 1.18.2，就是跳大版本。  
> 先从 1.20.4 升到 1.20.6，再以此为基础升 1.21，再升 1.21.4，这样会更平滑一点，不容易在做版本兼容的时候犯迷糊。但是这非常耗时间。  

## 没有写权限

fork 这个仓库，使用 [Github Desktop](https://desktop.github.com/) 打开仓库，基于你需要的分支 (`1.20.6`) 创建一个 `merge_changes` 分支（或者你想起什么就起什么，别重复就行。或者反正你是 fork 的，不创建分支也行，直接使用 `1.20.6` 分支，但不太推荐这么做）

![](https://pic1.imgdb.cn/item/679507d9d0e0a243d4f7f677.png)

![](https://pic1.imgdb.cn/item/67950803d0e0a243d4f7f67d.png)

然后选择一个分支，合并到你刚刚创建的 `merge_changes` 分支，别管有没有冲突，总之先合并，合并方式选择 `Create a merge commit`。

![](https://pic1.imgdb.cn/item/6795089dd0e0a243d4f7f690.png)

![](https://pic1.imgdb.cn/item/6795089dd0e0a243d4f7f691.png)

有冲突的话，会弹个提示框，让你把冲突都解决了再合并，点上面冲突的条目使用 VSCode 打开看看。

![](https://pic1.imgdb.cn/item/67950965d0e0a243d4f7f6c5.png)

优先采用传入的更改（来自 `1.20.4` 分支），总之看情况，有的时候要两边都保留，然后编译的时候出现报错再修。

改完之后不要着急点 `Continue merge`，先跑一遍 `gradlew clean build` 看看有没有问题（运行构建的时候注意 Java 版本），改到确认能通过编译了再继续合并。初次构建大约需要一个小时，主要看网络。

> 历史遗留问题，如果出现了以下报错
> ```
> The server may not support the client's requested TLS protocol versions: (TLSv1.2, TLSv1.3).
> ```
> 需要在命令末尾添加参数 `-Dhttps.protocols=TLSv1.1,TLSv1.2,TLSv1.3` 启用已经弃用的 `TLSv1.1`

构建产物会出现在 `平台/build/libs/` 文件夹，如 `fabric/build/libs/`，以 `-mc.jar` 结尾的文件。

合并之后，可以自己留着，也可以向我的仓库提交 Pull Requests，方便更多人直接使用。

## 拥有写权限

说的就是我，省略创建 `merge_changes` 分支，直接将 `1.20.4` 分支合并到 `1.20.6` 分支即可。
