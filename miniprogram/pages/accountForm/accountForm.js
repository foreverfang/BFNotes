import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify'
Page({
  data: {
    accountForm: {
      accountName: '',
      date: '', 
      remark: '' // 备注
    },
    formatterDate(type, value){
      if (type === 'year') {
        return `${value}年`;
      } else if (type === 'month') {
        return `${value}月`;
      } else if (type === 'day') {
        return `${value}日`;
      }
      return value;
    },
    minDate: new Date(2010, 0, 1).getTime(),
    relationOptions: [],
    dateShow: false,
    actionType: 'ADD'
  },
  onLoad(option){
    if(option.item){
      const data = JSON.parse(option.item);
      this.setData({
        accountForm: data,
        actionType: 'EDIT'
      })
    }else {
      this.setData({
        ["accountForm.date"]: this.formatDate(new Date())
      });
    }
  },
  onNameChange(e){
    this.setData({
      ["accountForm.accountName"]: e.detail
    });
  },
  onRemarkChange(e){
    this.setData({
      ["accountForm.remark"]: e.detail
    });
  },
  onDisplay(e){
    this.setData({
      dateShow: true
    });
  },
  formatDate(date) {
    date = new Date(date);
    return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`;
  },
  dateClose(e){
    this.setData({
      dateShow: false
    });
  },
  dateConfirm(e){
    this.setData({
      dateShow: false,
      ["accountForm.date"]: this.formatDate(e.detail)
    });
  },
  // 提交
  submit(e){
    if (!this.data.accountForm.accountName) {
      Notify({ type: 'warning', message: '名称必填' });
      return;
    }
    wx.showLoading({
      title: '正在提交...',
      mask: true
    });
    // 内容是否违规违法检测
    const checkContent = this.data.accountForm.accountName + this.data.accountForm.remark;
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
        const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
        if (this.data.actionType === "ADD") {
          const params = Object.assign({},this.data.accountForm, {createTime: db.serverDate()});
          db.collection('fang_account_receive').add({
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
            accountName: this.data.accountForm.accountName,
            date: this.data.accountForm.date, 
            remark: this.data.accountForm.remark,
            createTime: this.data.accountForm.createTime,
            updateTime: db.serverDate()
          };
          db.collection('fang_account_receive').doc(this.data.accountForm._id).update({
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