import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify'
Page({
  data: {
    destinationForm: {
      destination: '', // 旅游目的地
      note: '', // 注意事项
      remark: '', // 备注描述
      travelUrl: ''
    },
    actionType: 'ADD',
    fileList: [] //图片
  },
  onLoad(option){
    if(option.item){
      const data = JSON.parse(option.item);
      this.setData({
        destinationForm: data,
        actionType: 'EDIT',
        fileList: [{
          name: data.destination,
          url: data.travelUrl
        }]
      })
    }
  },
  onDestinationChange(e){
    this.setData({
      ["destinationForm.destination"]: e.detail
    });
  },
  onNoteChange(e){
    this.setData({
      ["destinationForm.note"]: e.detail
    });
  },
  onRemarkChange(e){
    this.setData({
      ["destinationForm.remark"]: e.detail
    });
  },
  afterRead(event){
    const { file } = event.detail;
    const fileNmae = `${this.data.destinationForm.destination ? (this.data.destinationForm.destination + new Date().getTime()) : new Date().getTime()}.png`;
    wx.showLoading({
      title: '正在加载...',
      mask: true
    });
    wx.cloud.uploadFile({
      // 指定上传到的云路径
      cloudPath: fileNmae,
      // 指定要上传的文件的小程序临时文件路径
      filePath: file.url
    }).then(res=>{
      wx.hideLoading();
      Notify({ type: 'success', message: '上传成功' });
      this.setData({
        ["destinationForm.travelUrl"]: res.fileID,
        fileList: [{
          url: file.url,
          name: fileNmae
        }]
      });
    }).catch(err=>{
      console.error("上传图片失败：",err);
      wx.hideLoading();
    });
  },
  // 图片删除
  onDeleteFile(){
    this.setData({
      fileList: []
    });
  },
  // 提交
  onSubmit(e){
    if (!this.data.destinationForm.destination) {
      Notify({ type: 'warning', message: '目的地必填' });
      return;
    }
    const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
    wx.showLoading({
      title: '正在加载...',
      mask: true
    });
    if (this.data.actionType === "ADD") {
      const params = Object.assign({},this.data.destinationForm, {createTime: db.serverDate()});
      db.collection('fang_travel').add({
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
        destination: this.data.destinationForm.destination,
        note: this.data.destinationForm.note,
        remark: this.data.destinationForm.remark,
        travelUrl: this.data.destinationForm.travelUrl,
        createTime: this.data.destinationForm.createTime,
        updateTime: db.serverDate()
      };
      db.collection('fang_travel').doc(this.data.destinationForm._id).update({
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