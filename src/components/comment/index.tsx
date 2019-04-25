
import React, { Component } from 'react'
import Feather from 'react-native-vector-icons/Feather'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { boundMethod } from 'autobind-decorator'
import { Observer } from 'mobx-react'
import { observer } from 'mobx-react/native'
import { observable, action, computed } from 'mobx'
import { FlatList, StyleSheet, View, TouchableHighlight, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { Text } from '@app/components/common/text'
import { TouchableView } from '@app/components/common/touchable-view'
import { AutoActivityIndicator } from '@app/components/common/activity-indicator'
import { IHttpPaginate, IRequestParams, IHttpResultPaginate } from '@app/types/http'
import { IComment, IAuthor } from '@app/types/business'
import { STORAGE } from '@app/constants/storage'
import { optionStore } from '@app/stores/option'
import fetch from '@app/services/fetch'
import storage from '@app/services/storage'
import colors from '@app/style/colors'
import sizes from '@app/style/sizes'
import fonts from '@app/style/fonts'
import mixins from '@app/style/mixins'
import { CommentItem } from './item'

type THttpResultPaginateComments = IHttpResultPaginate<IComment[]>

interface IProps {
  postId: number
  getListRef?(ref: any): void
  onScroll?(event: NativeSyntheticEvent<NativeScrollEvent>): void
}

@observer export class Comment extends Component<IProps> {
 
  constructor(props: IProps) {
    super(props)
    this.getLocalCommentLikes().then(() => {
      this.fetchComments()
    })
  }

  private listRef: any = null

  @boundMethod private updateListRef(ref: any) {
    this.listRef = ref
    this.props.getListRef && this.props.getListRef(ref)
  }

  @observable.ref private isLoading: boolean = false
  @observable.ref private isSortByHot: boolean = false
  @observable.ref private commentLikes: number[] = []

  @observable.ref private pagination: IHttpPaginate | null = null
  @observable.shallow private comments: IComment[] = []

  @action private updateLoadingState(loading: boolean) {
    this.isLoading = loading
  }

  @action private updatePagination(pagination: IHttpPaginate) {
    this.pagination = pagination
  }

  @action private updateCommentLikes(commentLikes: number[]) {
    this.commentLikes = commentLikes || []
  }

  @action private updateComments(comments: IComment[], isAdd: boolean) {
    if (isAdd) {
      this.comments.push(...comments)
    } else {
      this.comments = comments
    }
  }

  @action private updateResultData(resultData: THttpResultPaginateComments) {
    console.log('resultData', resultData)
    const { data, pagination } = resultData
    this.updateLoadingState(false)
    this.updateComments(data, pagination.current_page > 1)
    this.updatePagination(pagination)
  }

  @computed get listExtraData(): any {
    return [this.commentLikes, optionStore.language, optionStore.darkTheme]
  }

  @computed get commentListData(): IComment[] | null {
    const { comments: comments } = this
    return comments && comments.length
      ? comments.slice()
      : null
  }

  @computed get isNoMoreData(): boolean {
    return !!this.pagination && this.pagination.current_page === this.pagination.total_page
  }

  private getLocalCommentLikes(): Promise<any> {
    return storage.get<number[]>(STORAGE.COMMENT_LIKES)
      .then(likes => {
        this.updateCommentLikes(likes)
        return likes
      })
      .catch(error => {
        console.warn('Get local arrticle likes error:', error)
        return Promise.reject(error)
      })
  }

  @boundMethod private fetchComments(page: number = 1): Promise<any> {
    this.updateLoadingState(true)
    const params = {
      sort: this.isSortByHot ? 2 : -1,
      post_id: this.props.postId,
      per_page: 66,
      page
    }
    console.log('发起评论请求', params)
    return fetch.get<THttpResultPaginateComments>('/comment', params)
      .then(comment => {
        this.updateResultData(comment.result)
        return comment
      })
      .catch(error => {
        this.updateLoadingState(false)
        console.warn('Fetch comment list error:', error)
        return Promise.reject(error)
      })
  }

  private getCommentKey(comment: IComment, index?: number): string {
    return `index:${index}:sep:${comment.id}`
  }

  private getCommentLikedState(commentId: number): boolean {
    return this.commentLikes.indexOf(commentId) > -1
  }

  // 切换排序模式
  @boundMethod private handleToggleSortType() {
    // 归顶
    if (this.pagination && this.pagination.total > 0) {
      this.listRef.scrollToIndex({ index: 0, viewOffset: 0 })
    }
    // 修正参数
    action(() => {
      this.isSortByHot = !this.isSortByHot
    })
    // 重新请求数据
    setTimeout(() => this.fetchComments(), 266)
  }

  @boundMethod private handleLoadmoreArticle() {
    if (!this.isNoMoreData && !this.isLoading && this.pagination) {
      this.fetchComments(this.pagination.current_page + 1)
    }
  }

  @boundMethod private handleReplyComment(comment: IComment) {
    console.log('回复某个评论', comment)
  }

  @boundMethod private handleLikeComment(comment: IComment) {
    console.log('喜欢某个评论', comment)
  }

  @boundMethod private handlePressAuthor(author: IAuthor) {
    console.log('点击了某个评论作者', author)
  }

  /**
   * Empty or skeleton view
   * @function renderSkeletonOrEmptyView
   * @description 渲染文章列表为空时的两种状态：骨架屏、无数据
   */
  @boundMethod private renderSkeletonOrEmptyView(): JSX.Element | null {
    const { styles } = obStyles
    if (this.isLoading) {
      return null
    }
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.h4Title}>暂无数据，下拉刷新重试</Text>
        <TouchableHighlight
          underlayColor={colors.textSecondary}
          style={{ marginTop: sizes.gap }}
        >
          <Feather name="chevrons-down" size={22} style={{color: colors.textSecondary}} />
        </TouchableHighlight>
      </View>
    )
  }

  /**
   * 渲染加载更多
   * @function renderLoadmoreView
   * @description 渲染文章列表加载更多时的三种状态：加载中、无更多、上拉加载
   */
  @boundMethod private renderLoadmoreView(): JSX.Element | null {
    const { styles } = obStyles
    if (!this.commentListData || !this.commentListData.length) {
      return null
    }
    if (this.isLoading) {
      return (
        <View style={[styles.centerContainer, styles.loadmoreViewContainer]}>
          <AutoActivityIndicator style={{ marginRight: sizes.gap / 4 }} />
          <Text style={styles.smallTitle}>加载中...</Text>
        </View>
      )
    }
    if (this.isNoMoreData) {
      return (
        <View style={[styles.centerContainer, styles.loadmoreViewContainer]}>
          <Text style={styles.smallTitle}>没有更多啦</Text>
        </View>
      )
    }
    return (
      <View style={[styles.centerContainer, styles.loadmoreViewContainer]}>
        <Text style={[styles.smallTitle, { marginRight: sizes.gap / 4 }]}>上拉以加载更多</Text>
        <Feather name="arrow-up-circle" style={{color: colors.textSecondary}} />
      </View>
    )
  }

  private renderToolBoxView(): JSX.Element {
    const { pagination } = this
    const { styles } = obStyles

    return (
      <View style={styles.toolBox}>
        {pagination && pagination.total ? (
          <Text>{pagination.total} 条评论</Text>
        ) : (
          <Text>暂无评论</Text>
        )}
        <TouchableView onPress={this.handleToggleSortType}>
          <Ionicon
            name="ios-funnel"
            size={19}
            style={styles.toolSort}
          />
          <Ionicon
            name={this.isSortByHot ? 'ios-happy' : 'ios-time'}
            color={this.isSortByHot ? colors.primary : colors.textDefault}
            size={14}
            style={styles.toolSortType}
          />
        </TouchableView>
      </View>
    )
  }

  render() {
    const { styles } = obStyles
    return (
      <View style={styles.container}>
        {this.renderToolBoxView()}
        <FlatList
          style={styles.commentListView}
          data={this.commentListData}
          ref={this.updateListRef}
          // 首屏渲染多少个数据
          initialNumToRender={16}
          // 列表为空时渲染
          ListEmptyComponent={this.renderSkeletonOrEmptyView}
          // 加载更多时渲染
          ListFooterComponent={this.renderLoadmoreView}
          // 额外数据
          extraData={this.listExtraData}
          // 当前列表 loading 状态
          refreshing={this.isLoading}
          // 刷新
          onRefresh={this.fetchComments}
          // 加载更多安全距离（相对于屏幕高度的比例）
          onEndReachedThreshold={0}
          // 加载更多
          onEndReached={this.handleLoadmoreArticle}
          // 手势滚动
          onScroll={this.props.onScroll}
          // 唯一 ID
          keyExtractor={this.getCommentKey}
          // 单个主体
          renderItem={({ item: comment, index }) => {
            return (
              <Observer
                render={() => (
                  <CommentItem
                    key={this.getCommentKey(comment, index)}
                    comment={comment}
                    darkTheme={optionStore.darkTheme}
                    language={optionStore.language}
                    isLiked={this.getCommentLikedState(comment.id)}
                    onLike={this.handleLikeComment}
                    onReply={this.handleReplyComment}
                    onPressAuthor={this.handlePressAuthor}
                  />
                )}
              />
            )
          }}
        />
      </View>
    )
  }
}

const obStyles = observable({
  get styles() {
    return StyleSheet.create({
      container: {
        position: 'relative',
        flex: 1,
      },
      toolBox: {
        ...mixins.rowCenter,
        justifyContent: 'space-between',
        height: sizes.gap * 2,
        backgroundColor: colors.cardBackground,
        paddingHorizontal: sizes.gap,
        borderColor: colors.border,
        borderTopWidth: sizes.borderWidth,
        borderBottomWidth: sizes.borderWidth,
        marginTop: sizes.gap
      },
      toolSort: {
        marginRight: 8,
        color: colors.textDefault
      },
      toolSortType: {
        position: 'absolute',
        right: 0,
        bottom: 0,
      },
      commentListView: {
        // marginTop: sizes.goldenRatioGap,
        backgroundColor: colors.cardBackground
      },
      centerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: sizes.gap,
      },
      loadmoreViewContainer: {
        padding: sizes.gap * 0.66,
        flexDirection: 'row'
      },
      h4Title: {
        ...fonts.h4,
        color: colors.textSecondary,
      },
      smallTitle: {
        ...fonts.small,
        color: colors.textSecondary,
      }
    })
  }
})