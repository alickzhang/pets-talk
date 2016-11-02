import React, { Component } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ListView,
  TouchableHighlight,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  AlertIOS
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'

import Detail from './detail'
import request from '../common/request'
import config from '../common/config'

const width = Dimensions.get('window').width

let cachedData = {
  nextPage: 1,
  items: [],
  total: 0
}

class Item extends Component {
  constructor(props) {
    super(props)
    const { row } = this.props
    this.state = {
      row: row,
      like: row.like
    }
  }

  _like() {
    const like = !this.state.like
    const row = this.state.row
    const url = config.api.base + config.api.like
    const body = {
      id: row._id,
      like: like ? true : false,
      accessToken: 'abcd'
    }

    request.post(url, body).then(data => {
      if (data && data.success) {
        this.setState({
          like: like
        })
      } else {
        AlertIOS.alert(config.msg.error)
      }
    })
    .catch(error => {
      console.error(error)
      AlertIOS.alert(config.msg.error)
    })
  }

  render() {
    const { row } = this.state
    return (
      <TouchableHighlight onPress={this.props.onSelect}>
        <View style={styles.item}>
          <Text style={styles.title}>{row.title}</Text>
          <Image
            style={styles.thumbnail}
            source={{uri: row.thumbnail}}>
            <Icon
              name='ios-play'
              size={28}
              style={styles.play} />
          </Image>
          <View style={styles.itemFooter}>
            <View style={styles.handleBox}>
              <Icon
                name={this.state.like ? 'ios-heart' : 'ios-heart-outline'}
                size={28}
                onPress={this._like.bind(this)}
                style={[styles.handleIcon, this.state.like ? styles.like : null]} />
              <Text style={styles.handleText} onPress={this._like.bind(this)}>Like</Text>
            </View>
            <View style={styles.handleBox}>
              <Icon
                name='ios-chatboxes-outline'
                size={28}
                style={styles.handleIcon} />
              <Text style={styles.handleText}>Comment</Text>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}

class Home extends Component {
  constructor() {
    super()
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    this.state = {
      dataSource: ds.cloneWithRows([]),
      isLoading: false,
      isRefreshing: false
    }
  }

  _renderRow(row) {
    return (
      <Item
        key={row._id}
        row={row}
        onSelect={() => this._loadPage(row)}
      />
    )
  }

  componentDidMount() {
    this._fetchData(1)
  }

  _fetchData(page) {
    if (page !== 0) {
      this.setState({
        isLoading: true
      })
    } else {
      this.setState({
        isRefreshing: true
      })
    }

    request.get(config.api.base + config.api.video, {
      accessToken: 'abcd',
      page: page
    })
    .then(data => {
      if (data && data.success) {
        let items = cachedData.items.slice()

        if (page !== 0) {
          items = items.concat(data.data)
          cachedData.nextPage += 1
        } else {
          items = data.data.concat(items)
        }
        cachedData.items = items
        cachedData.total = data.total

        if (page !== 0) {
          this.setState({
            dataSource: this.state.dataSource.cloneWithRows(cachedData.items),
            isLoading: false
          })
        } else {
          this.setState({
            dataSource: this.state.dataSource.cloneWithRows(cachedData.items),
            isRefreshing: false
          })
        }
      }
    })
    .catch(error => {
      if (page !== 0) {
        this.setState({
          isLoading: false
        })
      } else {
        this.setState({
          isRefreshing: false
        })
      }
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

  _onRefresh() {
    if (!this._hasMore() || this.state.isRefreshing) {
      return
    }

    this._fetchData(0)
  }

  _renderFooter() {
    if (!this._hasMore() && cachedData.total !== 0) {
      return (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>No more videos</Text>
        </View>
      )
    }
    if (!this.state.isLoading) {
      return <View style={styles.loading} />
    }
    return <ActivityIndicator style={styles.loading} />
  }

  _loadPage(row) {
    const { navigator } = this.props
    if (navigator) {
      navigator.push({
        title: 'detail',
        component: Detail,
        params: {
          data: row
        }
      })
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>猫咪说</Text>
        </View>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this._renderRow.bind(this)}
          renderFooter={this._renderFooter.bind(this)}
          onEndReached={this._fetchMoreData.bind(this)}
          onEndReachedThreshold={20}
          refreshControl={
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={this._onRefresh.bind(this)}
              tintColor='#ff6666'
              title='Loading...'
            />
          }
          enableEmptySections={true}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustContentInsets={true}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#ccc'
    backgroundColor: '#F5FCFF'
  },

  header: {
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

  item: {
    width: width,
    marginBottom: 10,
    backgroundColor: '#fff'
  },

  title: {
    padding: 10,
    fontSize: 18,
    color: '#333'
  },

  thumbnail: {
    width: width,
    height: width * 0.56,
    resizeMode: 'cover'
  },

  play: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 46,
    height: 46,
    paddingTop: 9,
    paddingLeft: 18,
    backgroundColor: 'transparent',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 23,
    color: '#ff6666'
  },

  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#eee'
  },

  handleBox: {
    padding: 10,
    flexDirection: 'row',
    width: width / 2 - 0.5,
    justifyContent: 'center',
    backgroundColor: '#fff'
  },

  handleText: {
    paddingLeft: 12,
    fontSize: 18,
    color: '#333'
  },

  handleIcon: {
    fontSize: 22,
    color: '#333'
  },

  like: {
    color: '#ff6666'
  },

  loading: {
    marginVertical: 20
  },

  loadingText: {
    color: '#666',
    textAlign: 'center'
  }
})

export default Home
