import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast';
Page({
  data: {
    userInfo: {},
    showSettings: false,
    showShare: false,
    shareOptions: [
      { name: '微信', icon: 'wechat', openType: 'share' }
    ],
    currentDate: new Date().getFullYear(),
    copyright: ''
  },
  onLoad(){
    const data = wx.getStorageSync('userInfo');
    this.setData({
      userInfo: data,
      copyright: `©${this.data.currentDate} BF.版权所有`
    });
  },
  onPullDownRefresh(){
    wx.stopPullDownRefresh();
  },
  onShareAppMessage() {
    const that =this;
    return {
      title: 'BF随记分享', // 转发后 所显示的title
      path: '/pages/index/index', // 相对的路径
      success: (res)=>{ 
        that.onClose();
        console.log("分享成功",res);
      },
      fail: (err) => {
        // 分享失败
        console.log(err)
      }
    }
  },
  onSet(e){
    this.setData({
      showSettings: true
    });
  },
  // 设置 关闭
  onClose(e){
    this.setData({
      showSettings: false
    });
  },
  onShareClick(event) {
    this.setData({ showShare: true });
  },

  onShareClose() {
    this.setData({ showShare: false });
  },

  onShareSelect(event) {
    // Toast(event.detail.name);
    this.onShareClose();
  },
  // 建议反馈 关闭
  onFeedbackClick(e){
    this.setData({
      showSettings: false
    });
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    });
  }
})