<template>
  <div :class="['article-list', { 'no-article-list': isShowArticle }]">
    <div class="article-title">
      <router-link :to="moreArticle || '/timeline/'" class="iconfont icon-bi"
        >最近更新</router-link
      >
    </div>
    <div class="article-wrapper">
      <dl v-for="(item, index) in topPublishPosts" :key="index">
        <dd>{{ getNum(index) }}</dd>
        <dt>
          <router-link :to="item.path">
            <div>
              {{ item.title }}
              <span class="title-tag" v-if="item.frontmatter.titleTag">
                {{ item.frontmatter.titleTag }}
              </span>
            </div>
          </router-link>
          <span class="date">{{ getDate(item) }}</span>
        </dt>
      </dl>

      <dl>
        <dd></dd>
        <dt>
          <router-link :to="moreArticle || '/timeline/'" class="more"
            >更多文章></router-link
          >
        </dt>
      </dl>
    </div>
  </div>
</template>

<script>

export default {
  name: 'UpdateArticle',
  props: {
    length: {
      type: [String, Number],
      default: 3
    },
    home: {
      type: Boolean,
      default: false
    },
    moreArticle: String
  },
  data() {
    return {
      posts: [],
      currentPath: ''
    }
  },
  created() {
    this.posts = this.$site.pages
    this.currentPath = this.$page.path
  },
  computed: {
    topPublishPosts() {
      return this.$sortPostsByDateHome ? this.$sortPostsByDateHome.filter(post => {
        const { path } = post
        return path !== this.currentPath
      }).slice(0, this.length) : []

    },
    isShowArticle() {
      const { frontmatter } = this.$page
      return !(frontmatter.article !== false)
    }
  },
  methods: {
    getNum(index) {
      return index < 9 ? '0' + (index + 1) : index + 1
    },
    getDate(item) {
      return item.frontmatter.date ? item.frontmatter.date.split(" ")[0].slice(5, 10) : ''
    }
  },
  watch: {
    $route() {
      this.currentPath = this.$page.path
    }
  }
}
</script>

<style lang='stylus'>
// @require '../styles/wrapper.styl'
.article-list
  // @extend $wrapper
  padding 1rem 2rem
  @media (max-width $MQNarrow)
    padding 1rem 1.5rem
  &.no-article-list
    display none
  .article-title
    border-bottom 1px solid var(--borderColor)
    font-size 1.3rem
    padding 1rem
    a
      font-size 1.2rem
      color var(--textColor)
      opacity 0.9
      &:before
        margin-right 0.4rem
        font-size 1.1rem
  .article-wrapper
    overflow hidden
    dl
      border-bottom 1px dotted var(--borderColor)
      float left
      display flex
      padding 8px 0
      margin 0
      height 45px
      width 100%
      dd
        font-size 1.1rem
        color #F17229
        width 50px
        text-align center
        margin 0
        line-height 45px
      dt
        flex 1
        display flex
        a
          color var(--textColor)
          flex 1
          display flex
          height 45px
          align-items center
          font-weight normal
          div
            overflow hidden
            white-space normal
            text-overflow ellipsis
            display -webkit-box
            -webkit-line-clamp 2
            -webkit-box-orient vertical
            .title-tag
              // height 1.1rem
              // line-height 1.1rem
              border 1px solid $activeColor
              color $activeColor
              font-size 0.8rem
              padding 0 0.35rem
              border-radius 0.2rem
              margin-left 0rem
              transform translate(0, -0.05rem)
              display inline-block
          &:hover
            text-decoration underline
          &.more
            color $accentColor
        .date
          width 50px
          margin-right 15px
          color #999
          text-align right
          font-size 0.9rem
          line-height 45px
</style>
