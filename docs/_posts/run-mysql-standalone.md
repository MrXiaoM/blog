---
title: 配置并运行 MySQL 独立版（绿色版）
date: 2025-10-23 11:22:43
permalink: /post/run-mysql-standalone
description: 在 Windows 系统下的操作步骤详解
categories: 
  - 开发
tags: 
  - 数据库
  - MySQL
sidebar: auto
---

因为 MySQL 的 `.msi` 安装包对于某些应用场景来说还是太麻烦了，而且有可能产生非预期结果，所以写一篇配置**可以随时打包带走**的独立版本的教程。

## 下载

到 [MySQL 官网](https://www.mysql.com/) 依次点击 `DOWNLOADS`、`MySQL Community (GPL) Downloads`、`MySQL Community Server`，按图中提示进行下载

> 如果你很忙，[点击这里](https://dev.mysql.com/downloads/mysql/)可以直达。

![](https://pic1.imgdb.cn/item/68f993ee3203f7be0090155a.webp)

转跳页面点击 `No thanks, just start my download.` 正式开始下载。

## 部署

> 以下配置步骤基于 `8.0.44`、Windows 系统，其它版本和系统的步骤可能有所出入。

将下载的压缩包解压到任意路径，这里以 `D:\MySQL` 为例，解压后的简易目录结构如下。

```shell
D:\MySQL>tree
├─bin
├─docs
├─include
├─lib
└─share
```

先在 `D:\MySQL` 目录下创建一个配置文件 `my.ini`，写入以下内容：
```ini
[mysqld]
bind-address=127.0.0.1
port=3306
basedir=.
datadir=.\\data
max_connections=200
max_connect_errors=10
character-set-server=utf8mb4
default-storage-engine=INNODB
default_authentication_plugin=mysql_native_password
[mysql]
default-character-set=utf8mb4
[client]
port=3306
default-character-set=utf8mb4
```

> 在 `[mysqld]` 下面的是服务端配置：
> + `bind-address` 是绑定的IP地址
> + `port` 是绑定的端口
> + `basedir` 是运行目录，可以用相对路径
> + `datadir` 是数据目录，可以用相对路径
>
> 完整配置参数可以运行 `bin\mysqld --verbose --help`，在输出的帮助中，最后面有**配置键**以及**默认值**说明。

然后在 cmd 执行以下命令初始化数据表，如图所示
```shell
bin\mysqld --initialize --console
```

![](https://pic1.imgdb.cn/item/68f998d83203f7be00903d92.webp)

初始化完成之后，会在日志中提示 `root` 账户随机生成的密码，把它记下来。

## 运行以及修改密码

先执行以下命令启动 MySQL：

```shell
bin\mysqld --standalone --console
```

然后另开一个 cmd 窗口，执行以下命令修改密码为 `root`：

```shell
bin\mysqladmin --user="用户名" --password="旧密码" password "新密码"
# 例如执行
bin\mysqladmin --user="root" --password="0hIL?H)Yt&rg" password "root"
```

::: warning
建议仅在测试环境使用密码 `root`，禁止将**弱口令**用于生产环境！
:::

改好密码后，执行以下命令连接到 mysql 进行测试吧！

```shell
bin\mysql -u root
```

## 创建用户(可选)

先创建用户
```sql
-- 主机可以填写
-- '%' 代表所有主机均可连接 (可以远程访问)
-- 'localhost' 代表只有本地主机可以连接
-- 'x.x.x.x' 代表只有指定IP可以连接
CREATE USER '用户名'@'主机' IDENTIFIED by '密码';
```
然后授予权限
```sql
GRANT 权限 on 数据库.表 to '用户名'@'主机';
```
权限可以填写
+ `all privileges` 所有权限（不推荐）
+ `select` 查询权限
+ `select,insert,update,delete` 增删改查权限  
（不要哪个权限就删掉哪个，最终用逗号隔开）

授予完成之后，执行以下语句刷新权限
```sql
flush privileges;
```

## 创建脚本

在之前启动 MySQL 的窗口按下快捷键 `Ctrl+C` 关闭，然后创建启动脚本文件 `start.bat`，写入以下内容

```batch
@echo off
bin\mysqld --standalone --console
```

之后就可以双击 `start.bat` 启动 MySQL 了，可以随开随关。
