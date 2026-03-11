---
title: 在 Windows 上安装 WSL2 + Docker + Docker-Compose
date: 2026-03-11 14:53:50
permalink: /post/wsl-docker-installing
description: 横竖也需要 WSL，就不使用 Docker Desktop 桌面客户端了
categories: 
  - 开发
tags: 
  - Linux
  - Windows
  - Docker
sidebar: auto
---

因为有神人不配置虚拟环境，导致一个用 Python 写的后端接口项目只能用 Docker-Compose 跑起来，测试起来巨麻烦。

懒得改他的项目了，顺手配置个 Docker 环境运行。~~顺便水一篇博客。~~

## 安装 WSL2

我相信现在的 Windows 11 电脑应该都能跑起来，如果需要选择版本，选 Ubuntu 24.04 版本即可。
```batch
wsl --install
```

> 如果需要 WSL 和 Windows 的网络能够互相连通，例如 Windows 那边提供数据库、WSL 这边提供后端接口，请见 [为 WSL 配置端口转发](/post/wsl-port-proxy)

## 配置 apt 镜像源

我在广东，所以打算使用[南方科技大学](https://mirrors.sustech.edu.cn/help/ubuntu.html#introduction)的镜像。
```shell
sudo cp -a /etc/apt/sources.list.d/ubuntu.sources /etc/apt/sources.list.d/ubuntu.sources.bak
sudo sed -i "s@http://.*archive.ubuntu.com@https://mirrors.sustech.edu.cn@g" /etc/apt/sources.list.d/ubuntu.sources
sudo sed -i "s@http://.*security.ubuntu.com@https://mirrors.sustech.edu.cn@g" /etc/apt/sources.list.d/ubuntu.sources
sudo apt-get update
```
> ![](https://pic1.imgdb.cn/item/69b1126aad79459fdc9e2a1a.png)  
> SUSTech, sus

## 安装 Docker + Docker-Compose

```shell
sudo apt install -y docker.io docker-compose
```

装完之后新建配置文件，添加镜像源
```shell
sudo mkdir -p /etc/docker
sudo nano /etc/docker/daemon.json
```

默认情况下没有配置文件，以防万一还是提一嘴，写入以下内容，并确保修改后的 JSON 格式正确
```json
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
```
> 基本操作: 按下 `Ctrl+O` 并回车保存文件，按下 `Ctrl+X` 并回车退出编辑器。

然后重启 Docker 服务，并检查是否生效
```shell
sudo systemctl restart docker
sudo docker info
```

如果输出中包含以下内容，即代表镜像源添加完成
```
 Registry Mirrors:
  https://docker.1ms.run/
  https://docker.xuanyuan.me/
```

## 基本用法

Docker-Compose 极大简化了运行 Docker 容器的操作，只需要新建一个 `docker-compose.yml` 配置，然后
+ `docker-compose up -d` 启动当前目录下的容器
+ `docker-compose down` 停止当前容器
+ `docker-compose logs` 查看一次当前容器的日志
+ `docker-compose logs -f` 查看当前容器的日志，并持续跟踪日志更新

配置文件的编写方法就不多说了，需要什么需求交给 AI 就行。
