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
    // base: 'http://rap.taobao.org/mockjs/9286/',
    base: 'http://192.168.1.106:1234/',
    comment: 'api/comments',
    like: 'api/like',
    signature: 'api/signature',
    signup: 'api/u/signup',
    update: 'api/u/update',
    verify: 'api/u/verify',
    video: 'api/videos',
    videoUpload: 'api/videos/video_upload',
    audioUpload: 'api/videos/audio_upload'
  },

  cloudinary: {
    cloud_name: 'alick',
    api_key: '544875394991159',
    base: 'http://res.cloudinary.com/alick',
    image: 'https://api.cloudinary.com/v1_1/alick/image/upload',
    video: 'https://api.cloudinary.com/v1_1/alick/video/upload',
    audio: 'https://api.cloudinary.com/v1_1/alick/raw/upload'
  },

  images: {
    logo: '',
    record: require('../images/record.jpg')
  },

  msg: {
    error: 'An error occurred. Please try again later.'
  }
}