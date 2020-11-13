import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify'
Page({
  data: {
    feedbackInfo: {
      remark: '',
      contact: ''
    }
  },
  onRemarkChange(e){
    this.setData({
      ["feedbackInfo.remark"]: e.detail
    });
  },
  onContactChange(e){
    this.setData({
      ["feedbackInfo.contact"]: e.detail
    });
  },
  // 提交
  onSubmit(e){
    const that = this;
    const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
    wx.showLoading({
      title: '正在加载...',
      mask: true
    });
    const params = Object.assign({},this.data.feedbackInfo, {createTime: db.serverDate()});
    db.collection('fang_feedback').add({
      data: {...params}
    }).then(res=>{
      wx.hideLoading();
      Notify({ type: 'success', message: '提交成功，感谢您的宝贵意见！' });
      wx.navigateBack();
    }).catch(err=>{
      wx.hideLoading();
      Notify({ type: 'danger', message: err });
    });
  }
});