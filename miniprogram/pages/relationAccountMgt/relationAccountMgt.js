import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog';
import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify';
Page({
  data: {
    activeAccount: 'receive',
    receiveAccountList: [], //收礼账本数据
    receiveTotal: 0, // 总条数
    receivePageSize: 10, // 每页显示条数
    receivePage: 1, // 当前页
    receiveHasMore: true,
    giveUsersList: [], 
    giveTotal: 0, // 随礼总条数
    givePageSize: 5, // 随礼每页显示条数
    givePage: 1, // 随礼当前页
    giveHasMore: true,
    accountInfoString: '',
    defaultAvatar: 'cloud://scallop-2g4ppt2ya3b48261.7363-scallop-2g4ppt2ya3b48261-1303979843/defaultAvatar.jpg',
    searchValue: ''
  },
  onShow(){
    this.getAccountReceiveList();
    this.getAccountGiveList();
    this.setData({
      accountInfoString: JSON.stringify({accountType: 'give', accountId: ""})
    });
  },
  // 查收礼账本
  async getAccountReceiveList(){
    const that = this;
    const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
    const result = await db.collection('fang_account_receive').count();
    this.setData({
      receiveTotal: result.total
    });
    wx.showLoading({
      title: '正在加载...',
      mask: true
    });
    db.collection('fang_account_receive').limit(that.data.receivePageSize).get().then(res=>{
      wx.hideLoading();
      wx.stopPullDownRefresh();
      that.setData({
        receiveAccountList: res.data,
        receiveHasMore: res.data.length < that.data.receiveTotal ? true : false
      });
    }).catch(err=>{
      wx.hideLoading();
      Notify({ type: 'danger', message: err });
    });
  },
  getMoreData(tabName){
    const that = this;
    const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});

    const list = tabName === 'receive' ? "receiveAccountList" : "giveUsersList";
    const page = tabName === 'receive' ? "receivePage" : "givePage";
    const collectionName = tabName === 'receive' ? 'fang_account_receive' : 'fang_give_users';
    const total = tabName === 'receive' ? "receiveTotal" : "giveTotal";
    const pageSize = tabName === 'receive' ? "receivePageSize" : "givePageSize";
    const haseMore = tabName === 'receive' ? "receiveHasMore" : "giveHasMore";
    // 获取下一页数据
    if (that.data[list].length < that.data[total]) {
      wx.showLoading({
        title: '正在加载...',
        mask: true
      })
      db.collection(collectionName).skip(that.data[page] * that.data[pageSize]).limit(that.data[pageSize]).get()
        .then(res=>{
          wx.hideLoading();
          if (res.data.length) {
            that.setData({
              [list]: that.data[list].concat(res.data),
              [page]: that.data[page] + 1,
              [haseMore]: true
            });
          }
        }).catch(err=>{
          Notify({ type: 'danger', message: err });
          wx.hideLoading();
        })
    } else {
      that.setData({
        [haseMore]: false
      });
      wx.showToast({
        title: '没有更多数据了'
      })
    }
  },
  // 上拉加载更多
  onReachBottom(){
    this.getMoreData(this.data.activeAccount);
  },
  onTabChange(e){
    this.setData({
      activeAccount: e.detail.name
    });
  },
  // 跳转收礼列表
  onReceiveView(e){
    const clickType = e.detail;
    if (clickType === "cell") {
      const id = e.currentTarget.dataset.item._id;
      const params = Object.assign({},e.currentTarget.dataset.item, {accountType: 'receive', accountId: id});
      wx.navigateTo({
        url: "/pages/relation/relation?params=" + JSON.stringify(params)
      });
    }
  },
  // // 跳转随礼列表
  // onGiveView(e){
  //   const id = e.currentTarget.dataset.item._id;
  //   const params = Object.assign({},e.currentTarget.dataset.item, {accountType: 'give', accountId: id});
  //   wx.navigateTo({
  //     url: "/pages/relation/relation?params=" + JSON.stringify(params)
  //   });
  // },
  onClose(event){
    const that = this;
    const { position, instance } = event.detail;
    const { item } = event.currentTarget.dataset;
    switch (position) {
      case 'left':
        wx.navigateTo({
          url: "/pages/accountForm/accountForm?item=" + JSON.stringify(item)
        });
        instance.close();
        break;
      case 'cell':
        instance.close();
        break;
      case 'right':
        Dialog.confirm({
          message: '确定删除吗？'
        }).then(() => {
          const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
          const rowId = item._id;
          // 删除数据 
          db.collection('fang_account_receive').doc(rowId).remove().then(res=>{
            Notify({ type: 'success', message: '删除成功' });
            instance.close();
            this.getAccountReceiveList();
          }).catch(err=>{
            Notify({ type: 'warning', message: '删除失败' });
            instance.close();
          });
        }).catch(()=>{});
        break;
    }
  },

  /**
   * 随礼tab列表
    */ 
  // 查随礼列表数据
  async getAccountGiveList(){
    const that = this;
    const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
    const result = await db.collection('fang_give_users').count();
    this.setData({
      giveTotal: result.total
    });
    wx.showLoading({
      title: '正在加载...',
      mask: true
    });
    db.collection('fang_give_users').limit(that.data.givePageSize).get().then(res=>{
      wx.hideLoading();
      wx.stopPullDownRefresh();
      that.setData({
        giveUsersList: res.data,
        giveHasMore: res.data.length < that.data.receiveTotal ? true : false
      });
    }).catch(err=>{
      wx.hideLoading();
      Notify({ type: 'danger', message: err });
    });
  },
  onSearch(){
    const that = this;
    const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
    wx.showLoading({
      title: '正在加载...',
      mask: true
    });
    db.collection('fang_give_users').where({
      name: db.RegExp({
        regexp: that.data.searchValue,//做为关键字进行匹配
        options: 'i',//不区分大小写
      })
    }).get().then(res=>{
      wx.hideLoading();
      that.setData({
        giveUsersList: res.data
      });
    }).catch(err=>{
      wx.hideLoading();
    })
  },
  // 搜索框
  onChange(e) {
    this.setData({
      searchValue: e.detail,
    });
  },
  // 编辑
  onEdit(e){
    // 带上账本的参数
    const _item = Object.assign({}, e.currentTarget.dataset.item, { accountType: 'give', accountId: '' });
    wx.navigateTo({
      url: "/pages/relationForm/relationForm?item=" + JSON.stringify(_item),
      success: ()=>{},
      fail: ()=>{}
    });
  },
  // 删除
  onDelete(e){
    const that = this;
    Dialog.confirm({
      title: '提示',
      message: '确认删除吗？',
    }).then(()=>{
      const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
      const rowId = e.currentTarget.dataset.item._id;
      const imgId = e.currentTarget.dataset.item.avatarUrl;
      db.collection('fang_receive_users').doc(rowId).remove({
        success: res=>{
          // 删除数据 同时删除云存储的图片文件
          if (imgId) {
            wx.cloud.deleteFile({
              fileList: [imgId]
            }).then(res=>{}).catch(err=>{
              console.error(err);
            });
          }
          Notify({ type: 'success', message: '删除成功' });
          that.getRelationList();
        },
        fail: err=>{
          Notify({ type: 'danger', message: '删除失败' });
        }
      });
    }).catch(()=>{});
  }
})