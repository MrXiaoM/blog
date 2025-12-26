---
title: 在 vue 中作出继承组件类型的操作
date: 2025-12-27 03:47:23
permalink: /post/vue-extends-component
description: 有点麻烦，但的确能做到
categories: 
  - 开发
tags: 
  - 网站
  - 响应式
  - vue
sidebar: auto
---

我在为 [md-editor-v3](https://imzbf.github.io/md-editor-v3/zh-CN) 编写自定义预览组件，用于我的项目中，主要是想要实现：
+ 优雅地后处理 markdown-it 输出的 HTML，将某些 HTML 标签挂载为自定义组件
+ 添加类似于 VuePress 的 `plugin-markdown-tab` 插件的选项卡支持 (需要依赖上一项)
+ 为自定义预览组件添加属性和事件，给页面传入响应式数据到自定义预览组件中的机会

实际编写才发现，为什么 [mdit/plugin-tab](https://mdit-plugins.github.io/zh/tab.html) 不提供默认的样式和点击操作，原来坑在这等着我呢。用 vue 的架构配 markdown-it，显然不使用动态组件是很难优雅地实现替换 HTML 标签为自定义组件的，这样也就很难提供默认的样式和点击操作了。

如你所见，创建一个 Markdown 编辑器预览组件是很简单的

``` vue
<template>
  <MdPreview
    :modelValue="fileContent"
    :preview-component="CustomPreview"
  />
</template>
```

麻烦就麻烦在这个自定义预览组件 `CustomPreview`，我需要实现上述功能是需要自行编写 `CustomPreview` 的，但是文档没有说可以使用插槽，文档说的实现 `CustomPreview` 需要添加三个属性，然后把这个组件类型给放到参数里即可使用。

``` vue
<!-- CustomPreview.vue -->
<script setup lang="ts">
defineProps<{
  html: string;
  id?: string;
  className?: string;
}>();
</script>

<template>
  <div :id="id" :class="className" v-html="html"></div>
</template>
```

如果想要给 `CustomPreview` 添加属性或者事件，外面是传不进去参数的，总之就很麻烦。

## defineComponent

是的，我们可以用 `defineComponent()` 方法重新实现一个组件，截胡输入进去的属性，将 `CustomPreview` 组件加到模板里，把属性同步进去就好了。

我们需要在 `CustomPreview.vue` 里**额外**添加一个不使用组合式 API 的 `script` 块，用于添加静态方法，代码如下：
``` vue
<script>
import { h, reactive, toRefs } from 'vue';
// 这是自身组件引用，注意导入不要重名，可以在最前面加个 My 或者其它什么的
import MyCustomPreview from './CustomPreview.vue'

// 导出一个静态方法，用于创建包装，扩展属性
export function wrapPreview(properties) {
  return {
    // 需要截胡的属性定义
    props: {
      html: { type: String, required: true },
      id: { type: String, required: false },
      className: { type: String, required: false }
    },
    setup(props) {
      // 返回模板，添加一个 CustomPreview 组件
      // 用 reactive() 合并 ref[] 和普通属性数据等等，传入创建组件
      return () => h(MyCustomPreview, reactive({
        // 关键的是这里的 toRefs，将 reactive 转换为 ref[]，保留响应式关联
        ...toRefs(props),
        // 额外的事件和参数原样传入进去
        ...properties
      }))
    }
  }
}
</script>
```

## 使用

``` vue
<template>
  <MdPreview
    :modelValue="fileContent"
    :preview-component="customPreview"
  />
</template>
<script setup>
import { ref, defineComponent } from 'vue'
import { wrapPreview } from './CustomPreview.vue'

const customStyle = ref('')
// 定义一个新的组件，然后在上面的模板中使用这个组件
const customPreview = defineComponent(wrapPreview({
  // 在这里添加要扩展的属性，例如
  customStyle: customStyle,
  // 也可以添加事件，以 on 开头，使用驼峰命名
  onClick(e) {
    console.log('awa')
  },
}))

const fileContent = ref('')

</script>
```

## 后处理 HTML

这是我实现选项卡的方式，从 `vuepress 生态系统` 仓库抄了 `plugin-markdown-tab` 过来改进。

VuePress 的生态似乎允许很自然地通过字符串动态添加组件，但 vue 不行，所以需要手动处理 DOM 再将指定组件挂载上去。

代码是 AI 写的，我就不好意思放出来了。总的来说，思路是这样的：
+ 通过前端自带的 `DOMParser` 解析 html 字符串，遍历所有标签，寻找指定名称的标签，先将其替换为占位符标签 `span`，并记录**占位符标签的 ID** 与**组件类型的对应关系**，以及储存**标签的属性**、**插槽**等数据。然后将改完的 HTML 应用到模板中的指定组件（假设是 `staticContainer`）。
+ 使用 `await nextTick()` 等待到下一 tick，执行挂载操作。遍历那个应用了 HTML 的组件（假设是 `staticContainer`）的 DOM 标签，寻找上一步替换的占位符标签，拿到组件类型和数据等等，使用 `h` 和 `render` 方法，将组件挂载到指定 DOM 标签上。挂载过程需要递归执行，每次递归**都要等到下一 tick**，每次递归**只能挂载一个组件**，直到所有占位符标签都挂载完成为止。

听着就很麻烦是吧？插槽之类的 vue 特性也需要手动进行支持，不是特别优雅，但是能用，相对优雅。

最终实现了以 vue 形式输出到 HTML 的 `<tabs>` 标签，经过后处理之后，成功挂载为 vue 的 `<Tabs>` 标签，功能正常。通过一个 object 指定了标签的对应关系，只有指定的标签可以挂载，而且因为是手动导入的，不需要担心挂载错组件的问题。

``` javascript
import { Tabs } from './Tabs'

const componentMap = {
  'tabs': Tabs,
}
```

唯一的遗憾是插槽不能使用 `#slotname=""` 的格式了，因为 `DOMParser` 似乎不识别这种格式。
