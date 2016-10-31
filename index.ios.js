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
  Navigator
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'

import Home from './app/home/index'
import Edit from './app/edit/index'
import Account from './app/account/index'

export default class myApp extends Component {
  constructor() {
    super()
    this.state = {
      selectedTab: 'list'
    }
  }

  render() {
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
              let Component = route.component
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
          title="More"
          iconName='ios-more-outline'
          selectedIconName='ios-more'
          selected={this.state.selectedTab === 'more'}
          onPress={() => {
            this.setState({
              selectedTab: 'more',
            })
          }}>
          <Account />
        </Icon.TabBarItemIOS>
      </TabBarIOS>
    )
  }
}

const styles = StyleSheet.create({
})

AppRegistry.registerComponent('myApp', () => myApp)
