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
  AlertIOS,
  Modal,
  TextInput
} from 'react-native'
import Video from 'react-native-video'
import Icon from 'react-native-vector-icons/Ionicons'
import ImagePicker from 'react-native-image-picker'
import { CountDownText } from 'react-native-sk-countdown'
import { AudioRecorder, AudioUtils } from 'react-native-audio'
import Button from 'react-native-button'
import _ from 'lodash'

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

const defaultState = {
  // video
  previewVideo: null,
  videoId: null,

  // video player
  rate: 1,
  muted: true,
  repeat: false,
  resizeMode: 'contain',

  // video status
  videoProgress: 0,
  videoTotalDuration: 0,
  videoCurrentTime: 0,

  // video upload
  videoUploading: false,
  videoUploaded: false,
  videoUploadProgress: 0,

  // count down
  counting: false,
  recording: false,

  // audio
  audioPath: AudioUtils.DocumentDirectoryPath + '/myapp.aac',
  audioPlaying: false,
  recordDone: false,
  audioId: null,

  // audio upload
  audioUploading: false,
  audioUploaded: false,
  audioUploadProgress: 0,

  // modal
  title: '',
  animationType: 'slide',
  modalVisible: false,
  isSending: false,

  end: null
}

class Edit extends Component {
  constructor(props) {
    super(props)
    const user = this.props.user || {}
    this.state = _.clone(defaultState)
    this.state.user = user
  }

  componentDidMount() {
    this._asyncAppStatus()
    this._initAudio()
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

  _initAudio() {
    let audioPath = this.state.audioPath

    AudioRecorder.prepareRecordingAtPath(audioPath, {
      SampleRate: 22050,
      Channels: 1,
      AudioQuality: "Low",
      AudioEncoding: "aac"
    })
  }

  _onLoadStart() {}

  _onLoad() {}

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
      AudioRecorder.stopRecording()
      this.setState({
        videoProgress: 1,
        recording: false,
        recordDone: true
      })
    }

    if (this.state.audioPlaying) {
      this.setState({
        videoProgress: 1,
        audioPlaying: false
      })
    }
  }

  _onError(error) {
    console.error(error)
  }

  _getToken(type) {
    const { accessToken } = this.state.user
    const signatureUrl = config.api.base + config.api.signature

    return request.post(signatureUrl, {
      accessToken: accessToken,
      type: type
    }).catch(error => {
      console.error(error)
      AlertIOS.alert('Network error.')
    })
  }

  _constructBody(data, type) {
    const { signature, timestamp, key } = data.data
    const folder = type
    const tags = 'app,' + type
    const uri = type === 'video' ? this.state.previewVideo : this.state.audioPath

    const body = new FormData()
    body.append('folder', folder)
    body.append('signature', signature)
    body.append('tags', tags)
    body.append('timestamp', timestamp)
    body.append('api_key', config.cloudinary.api_key)
    body.append('resource_type', 'video')
    body.append('file', {
      type: 'video/mp4',
      uri: uri,
      name: key
    })

    return body
  }

  _pickVideo() {
    ImagePicker.showImagePicker(videoOptions, (res) => {
      if (res.didCancel) {
        return
      }

      this.setState({
        previewVideo: res.uri
      })

      const type = 'video'

      this._getToken(type).then(data => {
        if (data && data.success) {
          const body = this._constructBody(data, type)
          this._upload(body, type)
        }
      })
    })
  }

  _uploadAudio() {
    if (!this.state.audioId) {
      const type = 'audio'
      this._getToken(type).then(data => {
        if (data && data.success) {
          const body = this._constructBody(data, type)
          this._upload(body, type)
        }
      })
    }
    this._openModal()
  }

  _upload(body, type) {
    const xhr = new XMLHttpRequest()
    const url = config.cloudinary.video

    let state = {}
    state[type + 'Uploaded'] = false
    state[type + 'Uploading'] = true
    state[type + 'UploadingProgress'] = 0
    this.setState(state)

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
        console.log(response)
        let state = {}
        state[type] = response
        state[type + 'Uploaded'] = true
        state[type + 'Uploading'] = false
        state[type + 'UploadingProgress'] = 0
        this.setState(state)

        const updateUrl = config.api.base + config.api[type + 'Upload']
        const { accessToken } = this.state.user
        let updateBody = {
          accessToken: accessToken
        }
        updateBody[type] = response

        if (type === 'audio') {
          updateBody.videoId = this.state.videoId
        }

        request.post(updateUrl, updateBody).then(data => {
          if (data && data.success) {
            let mediaState = {}
            mediaState[type + 'Id'] = data.data
            if (type === 'audio') {
              this._openModal()
            }
            this.setState(mediaState)
          } else {
            AlertIOS.alert('An error occurs when uploading ' + type)
          }
        }).catch(error => {
          console.error(error)
          AlertIOS.alert('An error occurs when uploading ' + type)
        })
      }
    }

    if (xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = event.loaded / event.total

          let state = {}
          state[type + 'UploadProgress'] = percent
          this.setState(state)
        }
      }
    }

    xhr.send(body)
  }

  _cancel() {
    if (this.state.audioPlaying) {
      AudioRecorder.stopPlaying()
    }
    let state = _.clone(defaultState)
    state.user = this.state.user
    this.setState(state)
  }

  _record() {
    this.setState({
      videoProgress: 0,
      counting: false,
      recording: true,
      recordDone: false
    })
    this.refs.videoPlayer.seek(0)
    AudioRecorder.startRecording()
  }

  _counting() {
    if (!this.state.counting && !this.state.recording && !this.state.audioPlaying) {
      this.setState({
        counting: true
      })
      this.refs.videoPlayer.seek(this.state.videoTotalDuration)
    }
  }

  // _resetAudioAlert() {
  //   AlertIOS.alert(
  //     null,
  //     'Are you sure to record again? The current audio will be covered.',
  //     [
  //       {text: 'Cancel'},
  //       {text: 'OK', onPress: () => this._resetAudio()}
  //     ]
  //   )
  // }

  // _resetAudio() {
  //   if (this.state.audioPlaying) {
  //     AudioRecorder.stopPlaying()
  //   }
  //   if (this.state.recording) {
  //     AudioRecorder.stopRecording()
  //   }
  //   this.setState({
  //     recording: false,
  //     audioUploading: false,
  //     audioUploaded: false,
  //     audioUploadProgress: 0,
  //     audioPlaying: false,
  //     recordDone: false
  //   })
  //   this.refs.videoPlayer.seek(this.state.videoTotalDuration)
  // }

  _preview() {
    if (this.state.audioPlaying) {
      AudioRecorder.stopPlaying()
    }
    this.setState({
      videoProgress: 0,
      audioPlaying: true
    })
    AudioRecorder.playRecording()
    this.refs.videoPlayer.seek(0)
  }

  _setModalVisible(isVisible) {
    this.setState({
      modalVisible: isVisible
    })
  }

  _openModal() {
    this._setModalVisible(true)
  }

  _closeModal() {
    this._setModalVisible(false)
  }

  _submit() {
    if (this.state.title === '') {
      return AlertIOS.alert('Please enter title.')
    }
    const url = config.api.base + config.api.video
    const body = {
      title: this.state.title,
      videoId: this.state.videoId,
      audioId: this.state.audioId
    }
    const { user } = this.state

    if (user && user.accessToken) {
      body.accessToken = user.accessToken

      this.setState({
        publishing: true
      })

      request.post(url, body).then(data => {
        if (data && data.success) {
          this._closeModal()
          this._cancel()
        } else {
          AlertIOS.alert('publishing fails.')
          this.setState({
            publishing: false
          })
        }
      }).catch(error => {
        console.error(error)
        AlertIOS.alert(config.msg.error)
      })
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          {
            this.state.videoUploaded
            ? <TouchableOpacity style={styles.headerLeft} onPress={this._cancel.bind(this)}>
              <Text style={styles.headerText}>Cancel</Text>
            </TouchableOpacity>
            : <View style={styles.headerLeft}></View>
          }
          <Text style={[styles.headerText, styles.headerTitle]} numberOfLines={1}>Edit</Text>
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
                  this.state.recording || this.state.audioPlaying
                  ? <ProgressViewIOS
                    progress={this.state.videoProgress}
                    trackTintColor='#ccc'
                    progressTintColor='#ff6666'
                  />
                  : null
                }

                {
                  this.state.videoUploading && !this.state.videoUploaded
                  ? <View style={styles.progressTipBox}>
                    <Text style={styles.progressTip}>
                      Processing video, completed {(this.state.videoUploadProgress * 100).toFixed(0)}%
                    </Text>
                  </View>
                  : null
                }

                {
                  this.state.audioUploading && !this.state.audioUploaded
                  ? <View style={styles.progressTipBox}>
                    <Text style={styles.progressTip}>
                      Processing audio, completed {(this.state.audioUploadProgress * 100).toFixed(0)}%
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
                <Text style={styles.uploadDesc}>Better less than 20 seconds.</Text>
              </View>
            </TouchableOpacity>
          }

          {
            this.state.videoUploaded
            ? <View style={styles.recordBox}>
              <View style={[styles.recordIconBox, (this.state.recording || this.state.audioPlaying) && styles.recordOn]}>
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

          {
            this.state.recordDone
            ? <View style={styles.funcBtnBox}>
              <Button style={styles.funcBtn} onPress={this._preview.bind(this)}>Preview</Button>
              <Button style={styles.funcBtn} onPress={this._uploadAudio.bind(this)}>Upload</Button>
            </View>
            : null
          }
        </View>

        <Modal
          animationType={this.state.animationType}
          visible={this.state.modalVisible}>
          <View style={styles.modalContainer}>
            <Icon
              onPress={() => {
                this._closeModal()
              }}
              name='ios-close'
              style={styles.closeIcon} />
            {
              this.state.audioUploaded && !this.state.publishing
            }
            <TextInput
              placeholder='Please enter title'
              style={styles.inputField}
              autoCapitalize={'none'}
              autoCorrect={false}
              defaultValue={this.state.title}
              onChangeText={(text) => {
                this.setState({
                  title: text
                })
              }}
            />
            <Button style={styles.btn} onPress={this._submit.bind(this)}>Submit</Button>
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
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 25,
    paddingBottom: 12,
    backgroundColor: '#ff6666'
  },

  headerText: {
    color: '#fff',
    fontWeight: '600'
  },

  headerTitle: {
    fontSize: 16
  },

  headerLeft: {
    width: 50,
    marginLeft: 10
  },

  headerRight: {
    width: 50,
    marginRight: 10
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
    // position: 'absolute',
    // left: 0,
    // bottom: 0,
    width: width,
    height: 30,
    backgroundColor: 'rgba(244, 244, 244, 0.7)'
  },

  progressTip: {
    color: '#333',
    padding: 5,
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
  },

  funcBtnBox: {
    width: width,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },

  funcBtn: {
    width: width * 0.3,
    padding: 10,
    color: '#fff',
    borderRadius: 4,
    backgroundColor: '#ff6666'
  },

  modalContainer: {
    flex: 1,
    paddingTop: 45,
    padding: 10,
    backgroundColor: '#fff'
  },

  closeIcon: {
    alignSelf: 'center',
    fontSize: 30,
    color: '#ff6666'
  },

  inputField: {
    height: 40,
    padding: 5,
    color: '#333',
    fontSize: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 4
  },

  btn: {
    padding: 10,
    marginTop: 25,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff6666',
    borderRadius: 4,
    color: '#ff6666'
  }
})

export default Edit
