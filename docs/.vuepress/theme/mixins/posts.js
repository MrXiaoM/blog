import { filterPosts, sortPosts, sortPostsByDate, groupPosts, categoriesAndTags } from '../util/postData'

export default {
  computed: {
    $filterPosts () { // 过滤非文章页和首页的文章数据
      return filterPosts(this.$site.pages, false)
    },
    $filterPostsHome () { // 过滤非文章页和首页的文章数据
      return filterPosts(this.$site.pages, true)
    },
    $sortPosts () { // 按置顶和时间排序的文章数据
      return sortPosts(this.$filterPosts)
    },
    $sortPostsHome () { // 按置顶和时间排序的文章数据
      return sortPosts(this.$filterPostsHome)
    },
    $sortPostsByDate () { // 仅按时间排序的文章数据
      return sortPostsByDate(this.$filterPosts)
    },
    $sortPostsByDateHome () { // 仅按时间排序的文章数据
      return sortPostsByDate(this.$filterPostsHome)
    },
    $groupPosts () { // 按分类和标签分组的文章数据
      return groupPosts(this.$sortPosts)
    },
    $categoriesAndTags () { // 所有分类和标签数据
      return categoriesAndTags(this.$groupPosts)
    }
  }
}
