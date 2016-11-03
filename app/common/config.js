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
    signature: 'api/signature',
    signup: 'api/u/signup',
    update: 'api/u/update',
    verify: 'api/u/verify',
    video: 'api/videos',
  },

  msg: {
    error: 'An error occurred. Please try again later.'
  }
}