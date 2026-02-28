---
title: 为 WSL 配置端口转发
date: 2026-02-28 08:37:21
permalink: /post/wsl-port-proxy
description: 使得 Windows 能够访问 WSL 的端口，或者 WSL 能够访问 Windows 的端口
categories: 
  - 开发
tags: 
  - Linux
  - WSL
  - Windows
  - 端口
  - 网络
sidebar: auto
---

部署一些用于测试的服务的时候可能会用到 WSL，使得子系统与宿主机能够通信是比较重要的。

## 从 WSL 转发到 Windows

首先在 WSL 执行以下命令，获取其 IP 地址。
```shell
ip addr show eth0 | grep 'inet\b' | awk '{print $2}' | cut -d/ -f1
```
然后访问获取到的 IP 地址即可。

例如通过 python + FastAPI 编写一个简单的服务接口，通过 WSL 部署在 8000 端口，在浏览器可正常访问。

::: details (可选) 端口转发
在 CMD 执行以下命令新建端口转发，使得在 Windows 上也能通过 localhost 访问。
```batch
netsh interface portproxy add v4tov4 listenport=端口 listenaddress=0.0.0.0 connectport=端口 connectaddress=上述地址
```
如需删除端口转发，可以使用以下命令
```batch
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=端口
```
如需查看已建立的端口转发列表
```batch
netsh interface portproxy show all
```
:::

## 从 Windows 转发到 WSL

首先在 WSL 执行以下命令，获取宿主机（Windows）的 IP 地址。
```shell
cat /etc/resolv.conf | grep nameserver | awk '{ print $2 }'
```

然后在管理员 PowerShell 执行以下命令获取 WSL 网卡名称和 IP 地址
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like "*WSL*" } | Select-Object InterfaceAlias, IPAddress
```
以下格式作为参考
+ `vEthernet (WSL (Hyper-V firewall))`
+ `vEthernet (WSL)`

记下这个 IP 地址，可以在 WSL 通过这个 IP 地址访问到 Windows 上的端口。

再执行以下命令，对 WSL 开放 Windows 的防火墙
```powershell
New-NetFirewallRule -DisplayName "WSL" -Direction Inbound -InterfaceAlias "vEthernet (WSL)" -Action Allow
```

进行测试，在 WSL 连接 Windows 上的 MySQL 如下所示（假设你已经配置好允许指定 Host 访问了）
```shell
sudo apt install mysql-client-core-8.0
mysql --host=172.19.32.1 --port=3306 --user=root -p
```
