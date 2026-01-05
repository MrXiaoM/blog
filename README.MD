# blog

使用主题 [vuepress-theme-vdoing](https://github.com/xugaoyi/vuepress-theme-vdoing)。

## 本地调试

要求在支持创建软链接的文件系统中执行构建
```shell
yarn
# 如果是Linux运行
yarn dev
# 如果是Windows运行
yarn dev:win
```
如果不支持软链接，请先使用以下命令将依赖改为使用文件引用，再构建
```shell
yarn add vuepress-theme-vdoing@file:./vdoing/
```
软链接方式的依赖支持自动重载，在调试的时候会比较方便一点。
