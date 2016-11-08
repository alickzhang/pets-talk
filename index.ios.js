/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react'
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TabBarIOS,
  Navigator,
  AsyncStorage
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'

import Home from './app/home/index'
import Edit from './app/edit/index'
import Account from './app/account/index'
import Login from './app/account/login'

export default class myApp extends Component {
  constructor() {
    super()
    this.state = {
      selectedTab: 'edit',
      user: null,
      logined: false
    }
  }

  componentDidMount() {
    this._asyncAppStatus()
  }

  _asyncAppStatus() {
    AsyncStorage.getItem('user').then(data => {
      let user = null
      let newState = {}

      if (data) {
        user = JSON.parse(data)
      }

      if (user && user.accessToken) {
        newState.user = user
        newState.logined = true
      } else {
        newState.logined = false
      }

      this.setState(newState)
    })
  }

  _afterLogin(user) {
    user = JSON.stringify(user)
    AsyncStorage.setItem('user', user).then(() => {
      this.setState({
        logined: true,
        user: user
      })
    })
  }

  _logout() {
    AsyncStorage.removeItem('user')
    this.setState({
      logined: false,
      user: null
    })
  }

  render() {
    if (!this.state.logined) {
      return <Login afterLogin={this._afterLogin.bind(this)} />
    }

    return (
      <TabBarIOS
        unselectedTintColor="white"
        tintColor="white"
        barTintColor="darkslateblue">
        <Icon.TabBarItemIOS
          title="Home"
          iconName='ios-videocam-outline'
          selectedIconName='ios-videocam'
          selected={this.state.selectedTab === 'list'}
          onPress={() => {
            this.setState({
              selectedTab: 'list',
            })
          }}>
          <Navigator
            initialRoute={{
              title: 'home',
              component: Home
            }}
            configureScene={route => {
              return Navigator.SceneConfigs.FloatFromRight
            }}
            renderScene={(route, navigator) => {
              const Component = route.component
              return <Component {...route.params} navigator={navigator} />
            }}
          />
        </Icon.TabBarItemIOS>
        <Icon.TabBarItemIOS
          title="Record"
          iconName='ios-recording-outline'
          selectedIconName='ios-recording'
          selected={this.state.selectedTab === 'edit'}
          onPress={() => {
            this.setState({
              selectedTab: 'edit'
            })
          }}>
          <Edit />
        </Icon.TabBarItemIOS>
        <Icon.TabBarItemIOS
          title="Account"
          iconName='ios-more-outline'
          selectedIconName='ios-more'
          selected={this.state.selectedTab === 'account'}
          onPress={() => {
            this.setState({
              selectedTab: 'account',
            })
          }}>
          <Account user={this.state.user} logout={this._logout.bind(this)}/>
        </Icon.TabBarItemIOS>
      </TabBarIOS>
    )
  }
}

const styles = StyleSheet.create({
})

AppRegistry.registerComponent('myApp', () => myApp)
