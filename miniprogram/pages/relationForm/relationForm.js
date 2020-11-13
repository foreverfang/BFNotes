import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify'
Page({
  data: {
    relationForm: {
      accountId: '',
      accountType: '', // 所属账本类型：'receive' 和 'give'
      name: '',
      money: '', // 别人给自己的礼金
      moneyBack: '', // 上人情（自己给别人的礼金）
      relation: '', // 关系
      date: '', 
      cause: '', // 事由
      remark: '', // 备注
      avatarUrl: ''
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
    defaultDate: new Date().getTime(),
    minDate: new Date(2010, 0, 1).getTime(),
    dateShow: false,
    actionType: 'ADD',
    showLoading: false,
    fileList: [], //图片
    activeNames: [],
    relationOptions: [],
    relationShow: false,
    causeOptions: [],
    causeShow: false
  },
  formatOptions(data, name) {
    let dataset = [];
    for (let i = 0; i < data.length; i++) {
      dataset.push(data[i][name]);
    }
    console.log(name+"-dataset=", dataset);
    return dataset;
  },
  async onLoad(option){
    // 获取关系，事由下拉框数据
    const relationData = await this.getAllOptions('fang_relation_options');
    const causeData = await this.getAllOptions('fang_cause_options');
    this.setData({
      relationOptions: this.formatOptions(relationData.data, 'relationName'),
      causeOptions: this.formatOptions(causeData.data, 'causeName')
    });
    if(option.item){
      const data = JSON.parse(option.item);
      this.setData({
        relationForm: data,
        actionType: 'EDIT',
        fileList: [{
          name: data.name,
          url: data.avatarUrl
        }]
      })
    }else if(option.params) {
      const dataParams = JSON.parse(option.params);
      this.setData({
        ["relationForm.date"]: this.formatDate(new Date()),
        ["relationForm.accountType"]: dataParams.accountType,
        ["relationForm.accountId"]: dataParams.accountId
      });
    }
  },
  // 获取关系，事由下拉框数据
  async getAllOptions(collectionName){
    const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
    const PAGE_SIZE = 20; // 每次查20条
    const result =  await db.collection(collectionName).count(); // 查总共多少条数据
    const total = result.total;
    const batchTimes = Math.ceil(total/PAGE_SIZE); // 计算分几次取数据
    const tasks = [];
    wx.showLoading({
      title: '正在加载...',
      mask: true
    });
    for(let i =0; i < batchTimes; i++){
      const promise = db.collection(collectionName).skip(i*PAGE_SIZE).limit(PAGE_SIZE).get();
      tasks.push(promise);
    }
    const optionsResult = await Promise.all(tasks); 
    wx.hideLoading();
    if (optionsResult.length <= 0) {
      return null;
    }
    return optionsResult.reduce((pre, cur)=>{
      return {
        data: pre.data.concat(cur.data)
      };
    });
  },
  onNameChange(e){
    this.setData({
      ["relationForm.name"]: e.detail
    });
  },
  onMoneyChange(e){
    this.setData({
      ["relationForm.money"]: e.detail,
    });
  },
  onMoneyOutChange(e){
    this.setData({
      ["relationForm.moneyBack"]: e.detail,
    });
  },
  // 关系
  onRelationChange(e){
    // this.setData({
    //   ["relationForm.relation"]: e.detail
    // });
    // console.log("关系=", e.detail);
  },
  // 关系下拉选择器
  onSelectRelation(e){
    this.setData({
      relationShow: true
    });
  },
  // 关闭下拉选择器
  onRelationClose(){
    this.setData({
      relationShow: false
    });
  },
  onRelationConfirm(e) {
    const { value } = e.detail;
    this.setData({
      ["relationForm.relation"]: value
    });
    this.setData({
      relationShow: false
    });
  },
  onRelationCancel() {
    this.setData({
      relationShow: false
    });
  },
  // 事由
  onCauseChange(e){
    // this.setData({
    //   ["relationForm.cause"]: e.detail
    // });
  },
  // 事由下拉选择器
  onSelectCause(e){
    this.setData({
      causeShow: true
    });
  },
  // 关闭下拉选择器
  onCauseClose(e){
    this.setData({
      causeShow: false
    });
  },
  onCauseConfirm(e) {
    const { picker, value, index } = e.detail;
    this.setData({
      ["relationForm.cause"]: value
    });
    this.setData({
      causeShow: false
    });
  },
  onCauseCancel() {
    this.setData({
      causeShow: false
    });
  },
  // 备注
  onRemarkChange(e){
    this.setData({
      ["relationForm.remark"]: e.detail
    });
  },
  onShowMoreChange(event) {
    this.setData({
      activeNames: event.detail,
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
      ["relationForm.date"]: this.formatDate(e.detail)
    });
  },
  // 图片上传
  afterRead(event){
    const { file } = event.detail;
    const fileNmae = `${this.data.relationForm.name ? (this.data.relationForm.name + new Date().getTime()) : new Date().getTime()}.png`;
    wx.showLoading({
      title: '正在加载...',
      mask: true
    });
    // 校验图片是否安全合规
    wx.cloud.callFunction({
      name: 'imgcheck',
      data: {
        value: file
      }
    }).then(securityRes=>{
      if (securityRes.result.errCode == 87014) {
        wx.hideLoading();
        Notify({ type: 'danger', message: '图片含有违法违规内容' });
        return false;
      } else {
        wx.cloud.uploadFile({
          cloudPath: fileNmae, // 指定上传到的云路径
          filePath: file.url // 指定要上传的文件的小程序临时文件路径
        }).then(res=>{
          wx.hideLoading();
          Notify({ type: 'success', message: '上传成功' });
          this.setData({
            ["relationForm.avatarUrl"]: res.fileID,
            fileList: [{
              url: file.url,
              name: fileNmae
            }]
          });
        }).catch(err=>{
          console.error("上传图片失败：",err);
          wx.hideLoading();
        });
      }
    }).catch(err=>{
      console.error(err);
    });
  },
  // 删除云存储的图片
  deleteImg(imgId){
    if (imgId) {
      wx.cloud.deleteFile({
        fileList: [imgId]
      }).then(res=>{
        Notify({ type: 'success', message: '删除成功' });
      }).catch(err=>{
        console.error(err);
      });
    }
  },
  // 图片删除
  onDeleteFile(){
    if(this.data.relationForm.avatarUrl) {
      this.deleteImg(this.data.relationForm.avatarUrl);
    }
    this.setData({
      fileList: []
    });
  },
  // 提交
  submit(e){
    if (!this.data.relationForm.name) {
      Notify({ type: 'warning', message: '姓名/金额必填' });
      return false;
    }
    // 收礼账本的新增编辑
    if (this.data.relationForm.accountType === 'receive' && !this.data.relationForm.money) {
      Notify({ type: 'warning', message: '金额必填' });
      return false;
    } else if (this.data.relationForm.accountType === 'give' && !this.data.relationForm.moneyBack) { // 随礼账本的新增编辑
      Notify({ type: 'warning', message: '金额必填' });
      return false;
    }
    const that = this;
    const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
    that.setData({ showLoading: true });
    const collectionName = that.data.relationForm.accountType === 'receive' ? 'fang_receive_users' : 'fang_give_users';
    const dateToYear = that.data.relationForm.date ? new Date(that.data.relationForm.date).getFullYear() : new Date().getFullYear();
    if (that.data.actionType === "ADD") {
      const params = Object.assign({},that.data.relationForm, {createTime: db.serverDate(), year: dateToYear});
      db.collection(collectionName).add({
        data: {...params}
      }).then(res=>{
        that.setData({ showLoading: false });
        Notify({ type: 'success', message: '提交成功' });
        wx.navigateBack();
      }).catch(err=>{
        that.setData({ showLoading: false });
        Notify({ type: 'danger', message: err });
      });
    } else {
      const params = {
        name: that.data.relationForm.name,
        money: that.data.relationForm.money,
        moneyBack: that.data.relationForm.moneyBack,
        relation: that.data.relationForm.relation, 
        date: that.data.relationForm.date, 
        cause: that.data.relationForm.cause, 
        remark: that.data.relationForm.remark,
        avatarUrl: that.data.relationForm.avatarUrl,
        createTime: that.data.relationForm.createTime,
        accountType: that.data.relationForm.accountType,
        accountId: that.data.relationForm.accountId,
        updateTime: db.serverDate(),
        year: dateToYear
      };
      db.collection(collectionName).doc(that.data.relationForm._id).update({
        data: {...params}
      }).then(res=>{
        that.setData({ showLoading: false });
         Notify({ type: 'success', message: '修改成功' });
         wx.navigateBack();
      }).catch(err=>{
        Notify({ type: 'danger', message: err });
        that.setData({ showLoading: false });
      })
    }
  }
})