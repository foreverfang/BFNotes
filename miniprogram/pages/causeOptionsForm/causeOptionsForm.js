import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify'
Page({
  data: {
    causeOptionForm: {
      causeName: ''
    },
    actionType: 'ADD',
  },
  onLoad(option){
    if(option.item){
      const data = JSON.parse(option.item);
      this.setData({
        causeOptionForm: data,
        actionType: 'EDIT'
      })
    }
  },
  onNameChange(e){
    this.setData({
      ["causeOptionForm.causeName"]: e.detail
    });
  },
  // 提交
  submit(e){
    if (!this.data.causeOptionForm.causeName) {
      Notify({ type: 'warning', message: '名称必填' });
      return false;
    }
    
    const that = this;
    const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
    wx.showLoading({
      title: '正在提交...',
      mask: true
    });
    if (that.data.actionType === "ADD") {
      const params = Object.assign({}, that.data.causeOptionForm, { createTime: db.serverDate() });
      db.collection('fang_cause_options').add({
        data: {...params}
      }).then(res=>{
        wx.hideLoading();
        Notify({ type: 'success', message: '提交成功' });
        wx.navigateBack();
      }).catch(err=>{
        wx.hideLoading();
        Notify({ type: 'danger', message: err });
      });
    } else {
      const params = {
        causeName: that.data.causeOptionForm.causeName,
        createTime: that.data.causeOptionForm.createTime,
        updateTime: db.serverDate()
      };
      db.collection('fang_cause_options').doc(that.data.causeOptionForm._id).update({
        data: {...params}
      }).then(res=>{
          wx.hideLoading();
         Notify({ type: 'success', message: '修改成功' });
         wx.navigateBack();
      }).catch(err=>{
        Notify({ type: 'danger', message: err });
        wx.hideLoading();
      })
    }
  }
})