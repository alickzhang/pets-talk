import React, { Component } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  AsyncStorage,
  ProgressViewIOS,
  AlertIOS
} from 'react-native'
import Video from 'react-native-video'
import Icon from 'react-native-vector-icons/Ionicons'
import ImagePicker from 'react-native-image-picker'
import { CountDownText } from 'react-native-sk-countdown'

import config from '../common/config'
import request from '../common/request'

const width = Dimensions.get('window').width
const height = Dimensions.get('window').height
const videoOptions = {
  title: 'Select Video',
  cancelButtonTitle: 'Cancel',
  takePhotoButtonTitle: 'Take 10 seconds video',
  chooseFromLibraryButtonTitle: 'Choose from Videos',
  videoQuality: 'medium',
  mediaType: 'video',
  durationLimit: 10,
  noData: false,
  storageOptions: {
    skipBackup: true,
    path: 'images'
  }
}

class Edit extends Component {
  constructor(props) {
    super(props)
    const user = this.props.user || {}
    this.state = {
      user: user,

      // video
      previewVideo: null,
      video: null,

      // video player
      rate: 1,
      muted: true,
      repeat: false,
      resizeMode: 'contain',

      // video status
      videoOk: true,
      videoProgress: 0,
      videoTotalDuration: 0,
      videoCurrentTime: 0,

      // video upload
      videoUploading: false,
      videoUploaded: false,
      videoUploadProgress: 0,

      // count down
      counting: false,
      recording: false
    }
  }

  componentDidMount() {
    this._asyncAppStatus()
  }

  _asyncAppStatus() {
    AsyncStorage.getItem('user').then(data => {
      let user = null

      if (data) {
        user = JSON.parse(data)
      }

      if (user && user.accessToken) {
        this.setState({
          user: user
        })
      }
    })
  }

  _onLoadStart() {
  }

  _onLoad() {
  }

  _onProgress(data) {
    const duration = data.playableDuration
    const currentTime = data.currentTime
    const percent = currentTime / duration
    this.setState({
      videoTotalDuration: duration,
      videoCurrentTime: currentTime,
      videoProgress: percent
    })
  }

  _onEnd() {
    if (this.state.recording) {
      this.setState({
        videoProgress: 1,
        recording: false
      })
    }
  }

  _onError(error) {
    this.setState({
      videoOk: false
    })
    console.error(error)
  }

  _getQiniuToken() {
    const { accessToken } = this.state.user
    const signatureUrl = config.api.base + config.api.signature

    return request.post(signatureUrl, {
      accessToken: accessToken,
      cloud: 'qiniu',
      type: 'video'
    }).catch(error => {
      console.error(error)
      AlertIOS.alert('Network error.')
    })
  }

  _pickVideo() {
    ImagePicker.showImagePicker(videoOptions, (res) => {
      if (res.didCancel) {
        return
      }

      this.setState({
        previewVideo: res.uri
      })

      this._getQiniuToken().then(data => {
        if (data && data.success) {
          const { token, key } = data.data
          const body = new FormData()

          body.append('token', token)
          body.append('key', key)
          body.append('file', {
            type: 'video/mp4',
            uri: this.state.previewVideo,
            name: key
          })

          this._uploadVideo(body)
        }
      })
    })
  }

  _uploadVideo(body) {
    const xhr = new XMLHttpRequest()
    const url = config.qiniu.upload

    this.setState({
      videoUploading: true,
      videoUploaded: false,
      videoUploadProgress: 0
    })

    xhr.open('POST', url)
    xhr.onload = () => {
      if (xhr.status !== 200) {
        console.log(xhr.responseText)
        return AlertIOS.alert(config.msg.error)
      }

      let response = null
      try {
        response = JSON.parse(xhr.response)
      } catch(error) {
        console.error(error)
      }

      if (response) {
        this.setState({
          video: response,
          videoUploading: false,
          videoUploaded: true,
          videoUploadProgress: 0
        })

        const videoUrl = config.api.base + config.api.videoUpload
        const { accessToken } = this.state.user
        request.post(videoUrl, {
          accessToken: accessToken,
          video: response
        }).then(data => {
          if (!data || !data.success) {
            AlertIOS.alert(config.msg.error)
          }
        }).catch(error => {
          console.error(error)
          AlertIOS.alert(config.msg.error)
        })
      }
    }

    if (xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = event.loaded / event.total
          this.setState({
            videoUploadProgress: percent
          })
        }
      }
    }

    xhr.send(body)
  }

  _record() {
    this.setState({
      videoProgress: 0,
      counting: false,
      recording: true
    })
    this.refs.videoPlayer.seek(0)
  }

  _counting() {
    if (!this.state.counting && !this.state.recording) {
      this.setState({
        counting: true
      })
      this.refs.videoPlayer.seek(this.state.videoTotalDuration)
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}></View>
          <Text style={styles.headerTitle}>Edit</Text>
          <View style={styles.headerRight}></View>
        </View>

        <View style={styles.page}>
          {
            this.state.previewVideo
            ? <View style={styles.videoContainer}>
              <View style={styles.videoBox}>
                <Video
                  ref='videoPlayer'
                  source={{uri: this.state.previewVideo}}
                  style={styles.video}
                  volume={1}
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
                  this.state.videoUploading && !this.state.videoUploaded
                  ? <View style={styles.progressTipBox}>
                    <ProgressViewIOS
                      progress={this.state.videoUploadProgress}
                      trackTintColor='#ccc'
                      progressTintColor='#ff6666'
                    />
                    <Text style={styles.progressTip}>
                      Processing video, completed {(this.state.videoUploadProgress * 100).toFixed(0)}%
                    </Text>
                  </View>
                  : null
                }

                {
                  this.state.recording
                  ? <View style={styles.progressTipBox}>
                    <ProgressViewIOS
                      progress={this.state.videoProgress}
                      trackTintColor='#ccc'
                      progressTintColor='#ff6666'
                    />
                    <Text style={styles.progressTip}>
                      Recording video, completed {(this.state.videoProgress * 100).toFixed(0)}%
                    </Text>
                  </View>
                  : null
                }
              </View>
            </View>
            : <TouchableOpacity style={styles.uploadContainer} onPress={this._pickVideo.bind(this)}>
              <View style={styles.uploadBox}>
                <Image source={config.images.record} style={styles.uploadIcon} />
                <Text style={styles.uploadTitle}>Click me to upload video.</Text>
                <Text style={styles.uploadDesc}>Less than 20 seconds.</Text>
              </View>
            </TouchableOpacity>
          }

          {
            this.state.videoUploaded
            ? <View style={styles.recordBox}>
              <View style={[styles.recordIconBox, this.state.recording && styles.recordOn]}>
                {
                  this.state.counting && !this.state.recording
                  ? <CountDownText
                    style={styles.countBtn}
                    countType='seconds'
                    auto={true}
                    afterEnd={this._record.bind(this)}
                    timeLeft={3}
                    step={-1}
                    startText='Record'
                    endText='Go'
                    intervalText={sec => sec === 0 ? 'Go' : sec}
                  />
                  : <TouchableOpacity onPress={this._counting.bind(this)}>
                    <Icon name='ios-mic' style={styles.recordIcon} />
                  </TouchableOpacity>
                }
              </View>
            </View>
            : null
          }
        </View>
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
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 25,
    paddingBottom: 12,
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
    marginLeft: 10
  },

  headerRight: {
    width: 50,
    marginRight: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },

  page: {
    flex: 1,
    alignItems: 'center'
  },

  uploadContainer: {
    marginTop: 70,
    width: width - 40,
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff6666',
    borderRadius: 6
  },

  uploadBox: {
    justifyContent: 'center',
    alignItems: 'center'
  },

  uploadIcon: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
    margin: 20
  },

  uploadTitle: {
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 16,
    color: '#000'
  },

  uploadDesc: {
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 12,
    color: '#999'
  },

  videoContainer: {
    width: width
  },

  videoBox: {
    width: width,
    height: height * 0.6
  },

  video: {
    width: width,
    height: height * 0.6,
    backgroundColor: '#000'
  },

  progressTipBox: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: width,
    height: 30,
    backgroundColor: 'rgba(244, 244, 244, 0.7)'
  },

  progressTip: {
    color: '#333',
    textAlign: 'center'
  },

  recordBox: {
    width: width,
    height: 60,
    alignItems: 'center'
  },

  recordIconBox: {
    width: 68,
    height: 68,
    marginTop: -34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 34,
    backgroundColor: '#ff6666'
  },

  recordIcon: {
    fontSize: 58,
    backgroundColor: 'transparent',
    color: '#fff'
  },

  countBtn: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff'
  },

  recordOn: {
    backgroundColor: '#ccc'
  }
})

export default Edit
