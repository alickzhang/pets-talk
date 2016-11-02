'use strict'

export default {
  header: {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  },

  api: {
    base: 'http://rap.taobao.org/mockjs/9286/',
    comment: 'api/comments',
    like: 'api/like',
    signup: 'api/u/signup',
    verify: 'api/u/verify',
    video: 'api/videos',
  },

  msg: {
    error: 'An error occurred. Please try again later.'
  }
}