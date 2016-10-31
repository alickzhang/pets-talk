import React, { Component } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ListView,
  TextInput,
  Modal,
  AlertIOS,
  ProgressViewIOS
} from 'react-native'
import Video from 'react-native-video'
import Icon from 'react-native-vector-icons/Ionicons'
import Button from 'react-native-button'

import config from '../common/config'
import request from '../common/request'

const width = Dimensions.get('window').width
const height = width * 0.6

let cachedData = {
  nextPage: 1,
  items: [],
  total: 0
}

class Detail extends Component {
  constructor(props) {
    super(props)
    const { data } = this.props
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    this.state = {
      // video data
      data: data,

      // comments data
      dataSource: ds.cloneWithRows([]),

      // video player
      rate: 1,
      muted: false,
      repeat: false,
      resizeMode: 'contain',

      // video status
      videoLoaded: false,
      playing: false,
      paused: false,
      videoOk: true,
      videoProgress: 0,
      videoTotalDuration: 0,
      videoCurrentTime: 0,

      // comments status
      isLoading: false,

      // modal
      content: '',
      animationType: 'slide',
      modalVisible: false,
      isSending: false
    }
  }

  _backToHome() {
    const { navigator } = this.props
    if (navigator) {
      navigator.pop()
    }
  }

  _onLoadStart() {
  }

  _onLoad() {
  }

  _onProgress(data) {
    const duration = data.playableDuration
    const currentTime = data.currentTime
    const percent = currentTime / duration
    let newState = {
      videoTotalDuration: duration,
      videoCurrentTime: currentTime,
      videoProgress: percent
    }

    if (!this.state.videoLoaded) {
      newState.videoLoaded = true
    }
    if (!this.state.playing) {
      newState.playing = true
    }
    this.setState(newState)
  }

  _onEnd() {
    this.setState({
      videoProgress: 1,
      playing: false
    })
  }

  _onError(error) {
    this.setState({
      videoOk: false
    })
    console.error(error)
  }

  _replay() {
    this.refs.videoPlayer.seek(0)
  }

  _pause() {
    if (!this.state.paused) {
      this.setState({
        paused: true
      })
    }
  }

  _resume() {
    if (this.state.paused) {
      this.setState({
        paused: false
      })
    }
  }

  componentDidMount() {
    this._fetchData()
  }

  _renderHeader() {
    const { data } = this.state
    return (
      <View style={styles.listHeader}>
        <View style={styles.infoBox}>
          <Image style={styles.avatar} source={{uri: data.author.avatar}} />
          <View style={styles.descBox}>
            <Text style={styles.nickname}>{data.author.nickname}</Text>
            <Text style={styles.title}>{data.title}</Text>
          </View>
        </View>
        <View style={styles.commentInputBox}>
          <TextInput
            placeholder='Please leave your comment...'
            style={styles.commentInputContent}
            multiline={true}
            onFocus={this._focus.bind(this)}
          />
        </View>
        <View style={styles.commentArea}>
          <Text style={styles.comment}>Comments</Text>
        </View>
      </View>
    )
  }

  _renderRow(row) {
    return (
      <View key={row._id} style={styles.commentBox}>
        <Image style={styles.commentatorAvatar} source={{uri: row.commentator.avatar}} />
        <View style={styles.comment}>
          <Text style={styles.commentatorNickname}>{row.commentator.nickname}</Text>
          <Text style={styles.commentContent}>{row.content}</Text>
        </View>
      </View>
    )
  }

  _fetchData(page) {
    this.setState({
      isLoading: true
    })

    request.get(config.api.base + config.api.comment, {
      id: 123,
      accessToken: 'abcd',
      page: page
    })
    .then(data => {
      if (data && data.success) {
        let items = cachedData.items.slice()
        items = items.concat(data.data)
        cachedData.nextPage += 1
        cachedData.items = items
        cachedData.total = data.total
        this.setState({
          dataSource: this.state.dataSource.cloneWithRows(cachedData.items),
          isLoading: false
        })
      }
    })
    .catch(error => {
      this.setState({
        isLoading: false
      })
      console.error(error)
    })
  }

  _hasMore() {
    return cachedData.items.length !== cachedData.total
  }

  _fetchMoreData() {
    if (!this._hasMore() || this.state.isLoading) {
      return
    }

    this._fetchData(cachedData.nextPage)
  }

  _renderFooter() {
    if (!this._hasMore() && cachedData.total !== 0) {
      return (
        <View style={styles.loadingMore}>
          <Text style={styles.loadingText}>No more videos</Text>
        </View>
      )
    }
    if (!this.state.isLoading) {
      return <View style={styles.loadingMore} />
    }
    return <ActivityIndicator style={styles.loadingMore} />
  }

  _focus() {
    this._setModalVisible(true)
  }

  _setModalVisible(isVisible) {
    this.setState({
      modalVisible: isVisible
    })
  }

  _closeModal() {
    this._setModalVisible(false)
  }

  _submitComment() {
    if (!this.state.content) {
      return AlertIOS.alert('Empty')
    }

    if (this.state.isSending) {
      return AlertIOS.alert('Sending your comment...')
    }

    this.setState({
      isSending: true
    }, () => {
      const url = config.api.base + config.api.comment
      const body = {
        accessToken: 'abc',
        video: '12345',
        content: this.state.content
      }

      request.post(url, body).then(data => {
        if (data && data.success) {
          let items = cachedData.items.slice()
          const { content } = this.state

          items = [{
            content: content,
            commentator: {
              avatar: 'http://dummyimage.com/640x6400/e03624)',
              nickname: 'Alick Zhang'
            }
          }].concat(items)

          cachedData.items = items
          cachedData.total += 1
          this.setState({
            dataSource: this.state.dataSource.cloneWithRows(cachedData.items),
            isSending: false,
            content: ''
          })

          this._setModalVisible(false)
        }
      })
      .catch(error => {
        console.error(error)
        this.setState({
          isSending: false
        })
        this._setModalVisible(false)
        AlertIOS.alert(config.msg.error)
      })
    })
  }

  render() {
    const { data } = this.state
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerLeft} onPress={this._backToHome.bind(this)}>
            <Icon name='ios-arrow-back' style={styles.backIcon} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Detail</Text>
          <View style={styles.headerRight}></View>
        </View>
        <View style={styles.videoBox}>
          <Video
            ref='videoPlayer'
            source={{uri: data.video}}
            style={styles.video}
            volume={1}
            paused={this.state.paused}
            rate={this.state.rate}
            muted={this.state.muted}
            resizeMode={this.state.resizeMode}
            repeat={this.state.repeat}

            onLoadStart={this._onLoadStart.bind(this)}
            onLoad={this._onLoad.bind(this)}
            onProgress={this._onProgress.bind(this)}
            onEnd={this._onEnd.bind(this)}
            onError={this._onError.bind(this)}
          />

          {
            !this.state.videoOk && <Text style={styles.failText}>{config.msg.error}</Text>
          }

          {
            !this.state.videoLoaded && <ActivityIndicator style={styles.loading} />
          }

          {
            this.state.videoLoaded && !this.state.playing ?
            <TouchableOpacity style={styles.play} onPress={this._replay.bind(this)}>
              <Icon
                name='ios-play'
                size={40}
                color='#ff6666' />
            </TouchableOpacity>
            : null
          }

          {
            this.state.videoLoaded && this.state.playing ?
            <TouchableOpacity style={styles.pause} onPress={this._pause.bind(this)}>
              {
                this.state.paused ?
                <TouchableOpacity style={styles.play} onPress={this._resume.bind(this)}>
                  <Icon
                    name='ios-play'
                    size={40}
                    color='#ff6666' />
                </TouchableOpacity>
                : <Text></Text>
              }
            </TouchableOpacity>
            : null
          }

          <ProgressViewIOS
            progress={this.state.videoProgress}
            trackTintColor='#ccc'
            progressTintColor='#ff6666'
          />
        </View>

        <ListView
          dataSource={this.state.dataSource}
          renderRow={this._renderRow.bind(this)}
          renderHeader={this._renderHeader.bind(this)}
          renderFooter={this._renderFooter.bind(this)}
          onEndReached={this._fetchMoreData.bind(this)}
          onEndReachedThreshold={20}
          enableEmptySections={true}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustContentInsets={true}
        />

        <Modal
          animationType={this.state.animationType}
          visible={this.state.modalVisible}
          onRequestClose={() => this._setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <Icon
              onPress={this._closeModal.bind(this)}
              name='ios-close-outline'
              style={styles.closeIcon} />
            <View style={styles.commentInputBox}>
              <TextInput
                placeholder='Please leave your comment...'
                style={styles.commentInputContent}
                multiline={true}
                defaultValue={this.state.content}
                onChangeText={text => {
                  this.setState({
                    content: text
                  })
                }}
              />
            </View>
            <Button style={styles.submitBtn} onPress={this._submitComment.bind(this)}>Submit</Button>
          </View>
        </Modal>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF'
  },

  header: {
    width: width,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 25,
    paddingBottom: 12,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: '#ff6666'
  },

  headerTitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600'
  },

  headerLeft: {
    width: 50,
    flexDirection: 'row',
    alignItems: 'center'
  },

  headerRight: {
    width: 50
  },

  backIcon: {
    color: '#fff',
    fontSize: 20,
    marginRight: 5
  },

  backText: {
    color: '#fff'
  },

  videoBox: {
    width: width,
    height: height,
    backgroundColor: '#000'
  },

  video: {
    width: width,
    height: height,
    backgroundColor: '#000'
  },

  failText: {
    position: 'absolute',
    top: height / 2 + 40,
    left: 0,
    width: width,
    textAlign: 'center',
    color: '#fff',
    backgroundColor: 'transparent'
  },

  loading: {
    position: 'absolute',
    top: height / 2,
    left: 0,
    width: width,
    alignSelf: 'center',
    backgroundColor: 'transparent'
  },

  play: {
    position: 'absolute',
    top: height / 2 - 30,
    left: width / 2 - 30,
    width: 60,
    height: 60,
    paddingTop: 3,
    paddingLeft: 5,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 30
  },

  pause: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: 'transparent'
  },

  infoBox: {
    width: width,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10
  },

  avatar: {
    width: 60,
    height: 60,
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 30
  },

  descBox: {
    flex: 1,
    marginRight: 10
  },

  nickname: {
    fontSize: 18,
    color: '#666'
  },

  title: {
    marginTop: 8,
    fontSize: 16,
    color: '#666'
  },

  commentBox: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10
  },

  commentatorAvatar: {
    width: 40,
    height: 40,
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 20
  },

  comment: {
    flex: 1,
    marginRight: 10
  },

  commentatorNickname: {
    color: '#666'
  },

  commentContent: {
    marginTop: 4,
    color: '#666'
  },

  loadingMore: {
    marginVertical: 20
  },

  loadingText: {
    color: '#666',
    textAlign: 'center'
  },

  listHeader: {
    width: width,
    marginTop: 10
  },

  commentInputBox: {
    width: width,
    marginTop: 10,
    marginBottom: 10,
    padding: 10
  },

  commentInputContent: {
    height: 80,
    paddingLeft: 4,
    color: '#333',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 4,
    fontSize: 14
  },

  commentArea: {
    paddingBottom: 4,
    marginLeft: 10,
    marginRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },

  modalContainer: {
    flex: 1,
    paddingTop: 45,
    backgroundColor: '#fff'
  },

  closeIcon: {
    alignSelf: 'center',
    fontSize: 30,
    color: '#ff6666'
  },

  submitBtn: {
    width: width - 20,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ff6666',
    borderRadius: 4,
    color: '#ff6666',
    fontSize: 18,
    alignSelf: 'center'
  }
})

export default Detail
