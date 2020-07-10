import Vue from 'vue'
import axios from 'axios'
import Router from './../../router'

const Service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 3000,
  headers: {
    'Content-Type': 'application/json'
  }
})
const $vm = Vue.prototype
//取消请求 参考：https://blog.csdn.net/zhuxiandan/article/details/83689466
// const CancelToken = axios.CancelToken

//request 请求拦截器
Service.interceptors.request.use(
  (config: any) => {
    const X_obtoken = window.sessionStorage.getItem('X_obtoken')
    if (!!X_obtoken && Router.currentRoute.meta.requireAuth) {
      // 判断是否存在token，如果存在的话，则每个http header都加上token
      config.headers['X-obtoken'] = X_obtoken
    }
    //在发送请求之前，添加时间戳
    if (config.param) {
      config.param.ts = new Date().getTime()
    } else {
      config.param = {
        ts: new Date().getTime()
      }
    }
    return config
  },
  (error: any) => {
    return Promise.reject(error)
  }
)

//response 响应拦截器
Service.interceptors.response.use(
  (res: any) => {
    //token失效，loginFlag:1返回登录页面,loginFlag:0返回错误页面
    if (res.data.code === 9999) {
      Router.replace({
        name: 'login'
      })
    }
    return res
  },
  (error: any) => {
    switch (error.response.data.status) {
      case 400:
      case 401:
      case 403:
      case 404:
        $vm.$message.error('接口异常')
      case 500:
        $vm.$message.error('服务器繁忙')
    }
    return Promise.reject(error)
  }
)

$vm.get = (url: any, param: any, options: any) => {
  const config = options.config || {}
  config.params = param
  return new Promise((resolve: any, reject: any) => {
    Service.get(url, config)
      .then((res: any) => {
        if (res.data.status == 500) {
          throw res
        }
        resolve(res)
      })
      .catch((error: any) => {
        reject(error)
      })
  })
}

$vm.post = (url: any, param: any, options: any) => {
  return new Promise((resolve: any, reject: any) => {
    Service.post(url, param, (options && options.config) || {})
      .then(res => {
        if (res.data.status == 500) {
          throw res
        }
        resolve(res)
      })
      .catch(error => {
        reject(error)
      })
  })
}

export default {
  Service
}
