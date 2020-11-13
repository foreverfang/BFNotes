import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog';
import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify'
Page({
  data: {
    relationList: [],
    searchValue: '',
    defaultAvatar: 'cloud://scallop-2g4ppt2ya3b48261.7363-scallop-2g4ppt2ya3b48261-1303979843/defaultAvatar.jpg',
    total: 0, // 总条数
    pageSize: 5, // 每页显示条数
    page: 1, // 当前页
    hasMore: true,
    accountInfo: {}, // 账本信息
    accountInfoString: ''
  },
  formatList(data){
    let dataset = [];
    data.forEach(item=>{
      item.curMoney = parseFloat(item.money - item.moneyBack).toFixed(2);
      dataset.push(item);
    })
    return dataset;
  },
  // 查人情管理表
  async getRelationList(){
    const that = this;
    const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
    const result = await db.collection('fang_receive_users').where({
      accountId: that.data.accountInfo.accountId
    }).count();
    this.setData({
      total: result.total
    });
    wx.showLoading({
      title: '正在加载...',
      mask: true
    });
    db.collection('fang_receive_users').where({
      accountId: that.data.accountInfo.accountId // 筛选当前账本的数据
    }).limit(that.data.pageSize).get().then(res=>{
      wx.hideLoading();
      wx.stopPullDownRefresh();
      that.setData({
        relationList: that.formatList(res.data),
        hasMore: res.data.length < that.data.total ? true : false
      });
      console.log("relationList=", res.data);
    }).catch(err=>{
      wx.hideLoading();
      Notify({ type: 'danger', message: err });
    });
  },
  // 上拉加载更多
  onReachBottom(){
    const that = this;
    const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
    
    // 获取下一页数据
    if (that.data.relationList.length < that.data.total) {
      wx.showLoading({
        title: '正在加载...',
        mask: true
      });
      // 根据名字排序
      db.collection('fang_receive_users').where({
        accountId: that.data.accountInfo.accountId
      }).skip(that.data.page * that.data.pageSize).limit(that.data.pageSize).get()
        .then(res=>{
          wx.hideLoading();
          if (res.data.length) {
            that.setData({
              relationList: that.formatList(that.data.relationList.concat(res.data)),
              page: that.data.page + 1,
              hasMore: true
            });
          }
        }).catch(err=>{
          Notify({ type: 'danger', message: err });
          wx.hideLoading();
        })
    } else {
      that.setData({
        hasMore: false
      });
      wx.showToast({
        title: '没有更多数据了'
      })
    }
  },
  onChange(e) {
    this.setData({
      searchValue: e.detail,
    });
  },
  onSearch(){
    const that = this;
    const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
    wx.showLoading({
      title: '正在加载...',
      mask: true
    });
    db.collection('fang_receive_users').where({
      accountId: that.data.accountInfo.accountId,
      name: db.RegExp({
        regexp: that.data.searchValue,//做为关键字进行匹配
        options: 'i',//不区分大小写
      })
    }).get().then(res=>{
      wx.hideLoading();
      that.setData({
        relationList: res.data
      });
    }).catch(err=>{
      wx.hideLoading();
    })
  },
  onShow(){
    this.setData({
      page: 1,
      searchValue: ''
    });
    this.getRelationList();
  },
  onLoad(option){
    if(option.params){
      const data = JSON.parse(option.params);
      this.setData({
        accountInfo: data,
        accountInfoString: option.params
      })
    }
  },
  // 下拉刷新
  onPullDownRefresh(){
    this.setData({
      searchValue: '',
      page: 1
    });
    this.getRelationList();
  },
  // 编辑
  onEdit(e){
    // 带上账本的参数
    const _item = Object.assign({}, e.currentTarget.dataset.item, { accountType: this.data.accountInfo.accountType, accountId: this.data.accountInfo.accountId });
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