---
title: 在构建/运行 Flutter 应用时添加环境变量，作出差异化调整
date: 2026-03-30 08:57:36
permalink: /post/flutter-environment-vars
description: 例如在 Vercel 环境下使用不同的后端地址
categories: 
  - 开发
tags: 
  - 前端
  - Flutter
  - Google
sidebar: auto
---

通常在做前端开发时可能会存在多个环境，如果换一个环境就改一次代码中的参数太麻烦了，获取环境变量可能是一个更好的方法。

构建/运行时，只需要添加以下参数即可添加环境变量
```shell
flutter build (...) --dart-define=键=值
flutter run (...) --dart-define=键=值
```

需要获取环境变量时，只需要使用 `fromEnvironment` 方法就可以了
```dart
const IS_VERCEL = bool.fromEnvironment('VERCEL', defaultValue: false);
```

## 使用案例

```dart
// ignore_for_file: constant_identifier_names

class BuildConstants {
  static const API_HOST = bool.fromEnvironment('LOCAL_TEST', defaultValue: false)
      ? "内网测试地址"
      : "公网生产地址";
  static const IN_VERCEL = bool.fromEnvironment('VERCEL', defaultValue: false);

  static String getWebApiHost() {
    if (IN_VERCEL) {
      return '/api'; // Vercel 重写 /api 到公网生产地址
    } else {
      return API_HOST;
    }
  }
}
```

使用以下命令运行测试网页端，使用内网测试地址。
```shell
flutter run -d web-server --dart-define=LOCAL_TEST=true
```

使用以下命令构建网页端，使用公网生产地址，可作为静态站点部署到 nginx 等服务器软件上。
```shell
flutter build web --release --no-web-resources-cdn
```

部署到 Vercel，使用以下命令来构建，使用 `/api` 作为后端地址，在 Vercel 配置文件增加重写转发。
```shell
flutter build web --release --no-web-resources-cdn --dart-define=VERCEL=true
```

把这些命令写成脚本，需要什么就运行什么。
