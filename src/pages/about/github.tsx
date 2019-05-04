/**
 * Github
 * @file Github 项目列表
 * @module pages/about/github
 * @author Surmon <https://github.com/surmon-china>
 */

import React, { PureComponent } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { observable } from 'mobx'
import { IPageProps } from '@app/types/props'
import colors from '@app/style/colors'
import sizes from '@app/style/sizes'

export interface IGtihubProps extends IPageProps {}
export class Github extends PureComponent<IGtihubProps> {
  render() {
    const { styles } = obStyles
    return (
      <View style={styles.container}>
        <WebView
          style={styles.webview} 
          source={{ uri: 'https://github.com/surmon-china/surmon.me.native' }}
          startInLoadingState={true}
          domStorageEnabled={true}
          javaScriptEnabled={true}
        />
      </View>
    )
  }
}

const obStyles = observable({
  get styles() {
    return StyleSheet.create({
      container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
      },
      webview: {
        flex: 1,
        width: sizes.screen.width,
        height: sizes.screen.height,
        backgroundColor: colors.cardBackground
      }
    })
  }
})
