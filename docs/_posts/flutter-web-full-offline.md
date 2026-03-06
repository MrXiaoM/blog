---
title: 使 Flutter Web 完全离线化运行
date: 2026-03-06 14:51:42
permalink: /post/flutter-web-full-offline
description: 禁止 Flutter 从外网下载静态资源和字体
categories: 
  - 开发
tags: 
  - 前端
  - Flutter
  - Google
sidebar: auto
---

在工作时遇到了一些问题，我正在使用 Flutter 开发一个仅供内网使用的前端网页，但是发现 Flutter 会去下载 canvaskit，会从 gstatic 下载字体。

找了很多资料也没找到比较优雅的解决方案，于是决定自己研究一下。

## 静态资源

像是 canvaskit 这类静态资源，flutter 的命令行帮助就有提示，添加 `--no-web-resources-cdn` 就能将这些静态资源放到本地，而非从 Google 的 CDN 下载。

## 字体

这个处理起来就比较麻烦了，不知道 Google 抽的哪根筋，一定要下载字体，添加上述选项根本影响不到它，该下载还是会下载。

在 WebUI 配置 [configuration.dart](https://github.com/flutter/flutter/blob/f44e19be336c61d7326ad086fa96732ebcd249dc/engine/src/flutter/lib/web_ui/lib/src/engine/configuration.dart#L356-L362) 里面有一个默认值为 `"fonts.gstatic.com"` 的配置：
```dart
  /// Returns the base URL to load fallback fonts from. Fallback fonts are
  /// downloaded automatically when there is no font bundled with the app that
  /// can show a glyph that is being rendered.
  ///
  /// Defaults to 'https://fonts.gstatic.com/s/'.
  String get fontFallbackBaseUrl =>
      _configuration?.fontFallbackBaseUrl ?? 'https://fonts.gstatic.com/s/';
```
顺藤摸瓜，可以搜索到除了测试类以外，有两处使用到了这个 `fontFallbackBaseUrl`。

首先是 [fonts.dart](https://github.com/flutter/flutter/blob/e12f8c282fdb5cef62d8e64f41520c813ec1fb13/engine/src/flutter/lib/web_ui/lib/src/engine/canvaskit/fonts.dart#L11-L17C8)，它会在找不到 Roboto 字体时自动下载：
```dart
    var loadedRoboto = false;
    // manifest.families 是你添加到 pubspec.yaml 里面的字体
    for (final FontFamily family in manifest.families) {
      if (family.name == 'Roboto') {
        loadedRoboto = true; // 如果你添加过 Roboto 字体，标记一下已经添加了
      }
      for (final FontAsset fontAsset in family.fontAssets) {
        final String url = ui_web.assetManager.getAssetUrl(fontAsset.asset);
        pendingDownloads.add(_downloadFont(fontAsset.asset, url, family.name));
      }
    }

    // 没有字体的时候去 fonts.gstatic.com 下载
    /// We need a default fallback font for CanvasKit, in order to avoid
    /// crashing while laying out text with an unregistered font. We chose
    /// Roboto to match Android.
    if (!loadedRoboto) {
      // Download Roboto and add it to the font buffers.
      pendingDownloads.add(_downloadFont('Roboto', _robotoUrl, 'Roboto'));
    }
```

显而易见的，只要加一个自定义的本地字体就可以阻止 Flutter 从 Google 的 CDN 下载资源，如下所示：
```yaml
flutter:
  fonts:
    - family: 'Roboto'
      fonts:
          # 我懒得下 Roboto 字体了，用我需要的思源黑体代替
          # 如果你想的话，可以去下载 Roboto 字体
          # https://fonts.google.com/specimen/Roboto
          # 如果要中文支持的话，一定要下中文变体，不然操作完以后，中文全变成方块
        - asset: fonts/SourceHanSansCN-Regular.otf
```

事情就这样解决了吗？还没有！

你还可以在 [font_fallbacks.dart](https://github.com/flutter/flutter/blob/9d96df2364317334b55547ccb47c81aa9418eb71/engine/src/flutter/lib/web_ui/lib/src/engine/font_fallbacks.dart#L462) 找到这个地址，这里还有一处下载字体的地方：
```dart
  Future<void> startDownloads() async {
    final downloads = <String, Future<void>>{};
    final downloadedFontFamilies = <String>[];
    for (final NotoFont font in pendingFonts.values) {
      downloads[font.url] = Future<void>(() async {
        // 在这里，拼接下载地址
        final url = '${configuration.fontFallbackBaseUrl}${font.url}';
        try {
```
我也没看太懂这个类是干什么的，估计是在渲染文字的时候，如果找不到相应的 codePoint，就下载包含指定 codePoint 的 Noto Sans 字体。

> 在 canvaskit 的 [fonts.dart](https://github.com/flutter/flutter/blob/f44e19be336c61d7326ad086fa96732ebcd249dc/engine/src/flutter/lib/web_ui/lib/src/engine/canvaskit/fonts.dart#L23-L24)（跟之前的不是同一个文件）可以找到 `FontFallbackManager` 的使用。但似乎没有办法从这里下手修改，只能顺着它的逻辑看看能不能找到方法禁止下载。

孩子们我是真没招了，最后我只能用这个方法拦截 Noto Sans 的下载，返回一个只有零宽空格的空字体，至少让 Flutter 不报错。
```javascript
// web/block_notosans.js
(function() {
  const originalFetch = window.fetch;
  // 用在线字体编辑器搓出来的字体
  const woff2 = '774f463200010000000001b0000a0000000004a80000016700010000000000000000000000000000000000000000000006600082420a002a0b0400013602240304042005832d07241b1a04c82e06ec2679088d99cb650e66f89b1036dbc1fa968fe7f9d67ef7cdcc1743bdb3094b1bffe948d446272548164220e1ffffa9ef65700278317b687e2c5a6a6d0feba942406a1bdb030920ff1a60a1fe5fd57e5fdd1abff1a303dc39a003cb32cc9ed73e8db20ffc7dc71348acc98f340b2ca0c438f396edb13d5246af64a249fa16f7f8c7a159e6934af92d3f7c9487e6df65a4185600598300dcbe89313d60d2dd19d68e3f11a87b10ce302a2a8e30e8c982238a33a469c2d9ece51f380c64c8240414b8f94410f61f6d5fb5beb10dfcdd173d7300c60a08cf0b35a8d2004b2c910873d7b92f0c628a8062682aa03aa463d04c9d63307022c56068ea812c6d22b68c3a1473ef50ddb841b3a58781de331ada0ad8abc8a93fafacd6237184d00b50619a691a9c72dad658768cab764cbaa4a99dadb389b185b323475d7ab1d146587811843c01a860bb7c3c1f98383a59d8d9e63d359c0f0cd778dc245f62a217ecdc0100';
  const emptyWoff2Data = (function() {
    const result = [];
    for(var i = 0; i < woff2.length; i+=2) {
        result.push(parseInt(woff2.substring(i, i + 2), 16));
    }
    return Uint8Array.from(result)
  })();
  window.fetch = function(url, options) {
    // 拦截 notosans 的下载，替换成上述字体
    if (typeof url === 'string' && url.includes('fonts.gstatic.com/s/notosans')) {
      return Promise.resolve(new Response(emptyWoff2Data.buffer, { 
        status: 200, 
        statusText: 'OK',
        headers: { 'Content-Type': 'font/woff2' }
      }));
    }
    return originalFetch.apply(this, arguments);
  };
})();
```
```html
<!-- web/index.html -->
<body>
  <!-- 加在 flutter_bootstrap.js 前面 -->
  <script src="block_notosans.js"></script>
  <script src="flutter_bootstrap.js" async></script>
</body>
```
