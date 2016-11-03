import React, { Component } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  AsyncStorage,
  Image,
  AlertIOS,
  Modal,
  TextInput
} from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome'
import ImagePicker from 'react-native-image-picker'
import sha1 from 'sha1'
import * as Progress from 'react-native-progress'
import Button from 'react-native-button'

import config from '../common/config'
import request from '../common/request'

const width = Dimensions.get('window').width
const photoOptions = {
  title: 'Select Avatar',
  cancelButtonTitle: 'Cancel',
  takePhotoButtonTitle: 'Take Photo',
  chooseFromLibraryButtonTitle: 'Choose from Photos',
  quality: 0.75,
  allowsEditing: true,
  noData: false,
  storageOptions: {
    skipBackup: true,
    path: 'images'
  }
}

const CLOUDINARY = {
  cloud_name: 'alick',
  api_key: '544875394991159',
  api_secret: 'FskL--QHh47Ljvkgn8bCTORhAC0',
  base: 'http://res.cloudinary.com/alick',
  image: 'https://api.cloudinary.com/v1_1/alick/image/upload',
  video: 'https://api.cloudinary.com/v1_1/alick/video/upload',
  file: 'https://api.cloudinary.com/v1_1/alick/raw/upload'
}

avatar = (id, type) => {
  if (!id) {
    return
  }

  if (id.indexOf('http') > -1) {
    return id
  }

  if (id.indexOf('data:image') > -1) {
    return id
  }

  return CLOUDINARY.base + '/' + type + '/upload/' + id
}

class Account extends Component {
  constructor(props) {
    super(props)
    const user = this.props.user || {}
    this.state = {
      user: user,
      avatarUploadProgress: 0,
      avatarUploading: false,

      // modal
      content: '',
      animationType: 'slide',
      modalVisible: false,
      isSending: false
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

  _pickPhoto() {
    ImagePicker.showImagePicker(photoOptions, (res) => {
      if (res.didCancel) {
        return
      }

      const { user } = this.state
      const avatarData = 'data:image/jpeg;base64,' + res.data
      const timestamp = Date.now()
      const tags = 'app.avatar'
      const folder = 'avatar'
      const signatureUrl = config.api.base + config.api.signature

      request.post(signatureUrl, {
        accessToken: user.accessToken,
        timestamp: timestamp,
        folder: folder,
        tags: tags,
        type: 'avatar'
      })
      .then(data => {
        if (data && data.success) {
          const signature = 'folder=' + folder + '&tags=' + tags + '&timestamp=' + timestamp + CLOUDINARY.api_secret
          signature = sha1(signature)

          const body = new FormData()
          body.append('folder', folder)
          body.append('signature', signature)
          body.append('tags', tags)
          body.append('timestamp', timestamp)
          body.append('api_key', CLOUDINARY.api_key)
          body.append('resource_type', 'image')
          body.append('file', avatarData)

          this._uploadAvatar(body)
        }
      })
      .catch(error => {
        console.error(error)
      })
    })
  }

  _uploadAvatar(body) {
    const xhr = new XMLHttpRequest()
    const url = CLOUDINARY.image

    this.setState({
      avatarUploading: true,
      avatarUploadProgress: 0
    })

    xhr.open('POST', url)
    xhr.onload = () => {
      if (xhr.status !== 200) {
        console.log(xhr.responseText)
        return AlertIOS.alert(config.msg.error)
      }

      if (!xhr.responseText) {
        return AlertIOS.alert(config.msg.error)
      }

      let response = null
      try {
        response = JSON.parse(xhr.response)
      } catch(error) {
        console.error(error)
      }

      if (response && response.public_id) {
        let { user } = this.state
        user.avatar = response.public_id

        this.setState({
          user: user,
          avatarUploading: false,
          avatarUploadProgress: 0
        })

        this._asyncUser()
      }
    }

    if (xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = event.loaded / event.total
          this.setState({
            avatarUploadProgress: percent
          })
        }
      }
    }

    xhr.send(body)
  }

  _asyncUser() {
    const { user } = this.state

    if (user && user.accessToken) {
      const url = config.api.base + config.api.update

      request.post(url, user).then(data => {
        if (data && data.success) {
          const user = data.data
          this.setState({
            user: user
          }, () => {
            this._setModalVisible(false)
            AsyncStorage.setItem('user', JSON.stringify(user))
          })
        }
      }).catch(error => {
        console.error(error)
      })
    }
  }

  _setModalVisible(isVisible) {
    this.setState({
      modalVisible: isVisible
    })
  }

  _changeUserStatus(key, value) {
    let { user } = this.state
    user[key] = value
    this.setState({
      user: user
    })
  }

  _logout() {
    AlertIOS.alert(
      null,
      'Are you sure to log out?',
      [
        {text: 'Cancel'},
        {text: 'OK', onPress: () => this.props.logout()}
      ]
    )
  }

  render() {
    const { user } = this.state
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}></View>
          <Text style={styles.headerTitle}>Me</Text>
          <TouchableOpacity style={styles.headerRight} onPress={() => {
            this._setModalVisible(!this.state.modalVisible)
          }}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.avatarContainer}>
          <TouchableOpacity style={styles.avatarBox} onPress={this._pickPhoto.bind(this)}>
            {
              this.state.avatarUploading
              ? <Progress.Circle
                size={width * 0.2}
                showsText={true}
                color={'#ff6666'}
                progress={this.state.avatarUploadProgress} />
              : <View>
                {
                  user.avatar
                  ? <Image
                    source={{uri: avatar(user.avatar, 'image')}}
                    style={[styles.avatar, styles.avatarImage]} />
                  : <View style={[styles.avatar, styles.avatarIcon]}>
                    <Icon
                      name="user"
                      style={styles.plusIcon} />
                  </View>
                }
              </View>
            }
          </TouchableOpacity>
          <Text style={styles.nickname}>{user.nickname}</Text>
        </View>

        <Modal
          animationType={this.state.animationType}
          visible={this.state.modalVisible}>
          <View style={styles.modalContainer}>
            <Icon
              onPress={() => {
                this._setModalVisible(!this.state.modalVisible)
              }}
              name='close'
              style={styles.closeIcon} />
            <View style={styles.fieldItem}>
              <Text style={styles.label}>Nickname</Text>
              <TextInput
                placeholder='Please enter your nickname'
                style={styles.inputField}
                autoCapitalize={'none'}
                autoCorrect={false}
                defaultValue={user.nickname}
                onChangeText={(user) => {
                  this._changeUserStatus('nickname', user)
                }}
              />
            </View>
            <View style={styles.fieldItem}>
              <Text style={styles.label}>Breed</Text>
              <TextInput
                placeholder='Please enter your breed'
                style={styles.inputField}
                autoCapitalize={'none'}
                autoCorrect={false}
                defaultValue={user.breed}
                onChangeText={(user) => {
                  this._changeUserStatus('breed', user)
                }}
              />
            </View>
            <View style={styles.fieldItem}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                placeholder='Please enter your age'
                style={styles.inputField}
                autoCapitalize={'none'}
                autoCorrect={false}
                defaultValue={user.age}
                onChangeText={(user) => {
                  this._changeUserStatus('age', user)
                }}
              />
            </View>
            <View style={styles.fieldItem}>
              <Text style={styles.label}>Gender</Text>
              <Icon.Button
                onPress={() => {
                  this._changeUserStatus('gender', 'male')
                }}
                backgroundColor={user.gender === 'male' ? '#ff6666' : '#ccc'}
                borderRadius={4}
                name='mars'>Male</Icon.Button>
              <Icon.Button
                onPress={() => {
                  this._changeUserStatus('gender', 'female')
                }}
                backgroundColor={user.gender === 'female' ? '#ff6666' : '#ccc'}
                borderRadius={4}
                name='venus'>Female</Icon.Button>
            </View>
            <Button style={styles.btn} onPress={this._asyncUser.bind(this)}>Save</Button>
          </View>
        </Modal>

        <Button style={styles.btn} onPress={this._logout.bind(this)}>Logout</Button>
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

  editText: {
    color: '#fff',
    fontWeight: '600'
  },

  avatarContainer: {
    width: width,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ccc'
  },

  avatarBox: {
    marginTop: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },

  avatar: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: width * 0.1
  },

  avatarImage: {
    resizeMode: 'cover'
  },

  avatarIcon: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center'
  },

  plusIcon: {
    color: '#666',
    fontSize: 40,
    backgroundColor: 'transparent'
  },

  nickname: {
    marginTop: 10,
    color: '#fff',
    fontWeight: '600'
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

  fieldItem: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 15,
    borderColor: '#eee',
    borderBottomWidth: 1
  },

  label: {
    width: 80,
    color: '#ccc',
    fontSize: 16,
    marginRight: 10
  },

  inputField: {
    flex: 1,
    height: 50,
    color: '#666',
    fontSize: 16,
    backgroundColor: 'transparent'
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

export default Account
