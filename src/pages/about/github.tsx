
import React, { Component } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { observer } from 'mobx-react/native'
import { observable, action } from 'mobx'
import { IPageProps } from '@app/types/props'
import colors from '@app/style/colors'
import sizes from '@app/style/sizes'

interface IProps extends IPageProps {}

@observer export class Github extends Component<IProps> {

  constructor(props: IProps) {
    super(props)
  }

  @observable loading: boolean = true

  render() {
    const { styles } = obStyles
    return (
      <View style={styles.container}>
        <WebView
          style={styles.webview} 
          source={{ uri: 'https://github.com/surmon-china/surmon.me.native' }}
          onLoad={action(() => this.loading = true)}
          onLoadEnd={action(() => this.loading = false)}
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