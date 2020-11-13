import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify'
Page({
  data: {
    relationOptionForm: {
      relationName: ''
    },
    actionType: 'ADD',
  },
  onLoad(option){
    if(option.item){
      const data = JSON.parse(option.item);
      this.setData({
        relationOptionForm: data,
        actionType: 'EDIT'
      })
    }
  },
  onNameChange(e){
    this.setData({
      ["relationOptionForm.relationName"]: e.detail
    });
  },
  // 提交
  submit(e){
    if (!this.data.relationOptionForm.relationName) {
      Notify({ type: 'warning', message: '名称必填' });
      return false;
    }
    wx.showLoading({
      title: '正在提交...',
      mask: true
    });
    // 内容是否违规违法检测
    const checkContent = this.data.relationOptionForm.relationName;
    wx.cloud.callFunction({
      name: 'msgcheck',
      data: {
        content: checkContent
      }
    }).then(securityRes=>{
      if (securityRes.result.errCode === 87014) {
        wx.hideLoading();
        Notify({ type: 'danger', message: '内容含有违法违规内容' });
        return false;
      } else {
        const that = this;
        const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
        if (that.data.actionType === "ADD") {
          const params = Object.assign({}, that.data.relationOptionForm, { createTime: db.serverDate() });
          db.collection('fang_relation_options').add({
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
            relationName: that.data.relationOptionForm.relationName,
            createTime: that.data.relationOptionForm.createTime,
            updateTime: db.serverDate()
          };
          db.collection('fang_relation_options').doc(that.data.relationOptionForm._id).update({
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
    }).catch(err=>{
      console.error(err);
    });
    
    
  }
})