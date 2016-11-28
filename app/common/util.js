'use strict'

import config from './config'

export function avatar(key) {
  if (!key) {
    return
  }

  if (key.indexOf('http') > -1) {
    return key
  }

  if (key.indexOf('data:image') > -1) {
    return key
  }

  return config.cloudinary.base + '/image/upload/' + key
}
