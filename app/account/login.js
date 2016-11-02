import React, { Component } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Dimensions,
  AlertIOS
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import Button from 'react-native-button'
import { CountDownText } from 'react-native-sk-countdown'

import config from '../common/config'
import request from '../common/request'

const width = Dimensions.get('window').width
const height = width * 0.6

class Login extends Component {
  constructor() {
    super()
    this.state = {
      phoneNumber: '',
      verifyCode: '',
      codeSent: false,
      countingDown: false
    }
  }

  _sendVerifyCode() {
    const { phoneNumber } = this.state
    if (!phoneNumber) {
      return AlertIOS.alert('Please enter phone number.')
    }

    const body = {
      phoneNumber: phoneNumber
    }
    const url = config.api.base + config.api.signup

    request.post(url, body).then(data => {
      if (data && data.success) {
        this._showVerifyCode()
      } else {
        AlertIOS.alert(config.msg.error)
      }
    }).catch(error => {
      AlertIOS.alert(config.msg.error)
    })
  }

  _showVerifyCode() {
    this.setState({
      codeSent: true,
      verifyCode: ''
    })
  }

  _countingDown() {
    this.setState({
      countingDown: true
    })
  }

  _submit() {
    const { phoneNumber, verifyCode } = this.state
    if (!phoneNumber || !verifyCode) {
      return AlertIOS.alert('Please enter phone number and verify code.')
    }

    const body = {
      phoneNumber: phoneNumber,
      verifyCode: verifyCode
    }
    const url = config.api.base + config.api.verify

    request.post(url, body).then(data => {
      if (data && data.success) {
        this.props.afterLogin(data.data)
      } else {
        AlertIOS.alert(config.msg.error)
      }
    }).catch(error => {
      AlertIOS.alert(config.msg.error)
    })
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.signupBox}>
          <Text style={styles.title}>Sign up</Text>
          <TextInput
            placeholder='Phone Number'
            autoCapitalize={'none'}
            autoCorrect={false}
            keyboardType={'number-pad'}
            style={styles.inputField}
            onChangeText={text => {
              this.setState({
                phoneNumber: text
              })
            }}
          />

          {
            this.state.codeSent
            ? <View style={styles.verifyCodeBox}>
              <TextInput
                placeholder='Verify Code'
                autoCapitalize={'none'}
                autoCorrect={false}
                keyboardType={'number-pad'}
                style={styles.inputField}
                onChangeText={text => {
                  this.setState({
                    verifyCode: text
                  })
                }}
              />

              {
                this.state.countingDown
                ? <Button style={styles.countBtn} onPress={this._sendVerifyCode.bind(this)}>Resend</Button>
                : <CountDownText
                  style={styles.countBtn}
                  countType='seconds'
                  auto={true}
                  afterEnd={() => {this._countingDown.bind(this)}}
                  timeLeft={10}
                  step={-1}
                  startText='Send'
                  endText='resend'
                  intervalText={sec => sec + ' seconds'}
                />
              }
            </View>
            : null
          }

          {
            this.state.codeSent
            ? <Button style={styles.btn} onPress={this._submit.bind(this)}>Sign up</Button>
            : <Button style={styles.btn} onPress={this._sendVerifyCode.bind(this)}>Get Verify Code</Button>
          }
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    // backgroundColor: '#F5FCFF'
    backgroundColor: '#f9f9f9'
  },

  signupBox: {
    marginTop: 30
  },

  title: {
    marginBottom: 20,
    color: '#333',
    fontSize: 20,
    textAlign: 'center'
  },

  inputField: {
    flex: 1,
    height: 40,
    padding: 5,
    color: '#666',
    fontSize: 16,
    backgroundColor: '#fff',
    borderRadius: 4
  },

  verifyCodeBox: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  countBtn: {
    width: 110,
    height: 40,
    padding: 10,
    marginLeft: 8,
    color: '#ff6666',
    borderColor: '#ff6666',
    borderWidth: 1,
    borderRadius: 4,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15
  },

  btn: {
    padding: 10,
    marginTop: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff6666',
    borderRadius: 4,
    color: '#ff6666'
  }
})

export default Login
