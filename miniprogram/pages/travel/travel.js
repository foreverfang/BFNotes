import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog';
import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify';

Page({
  data: {
    fangTarvelList: [],
    searchValue: '',
    total: 0, // 总条数
    pageSize: 5, // 每页显示条数
    page: 1, // 当前页
    hasMore: true
  },
  // 查环游世界表
  async getTravelList(){
    const that = this;
    const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
    const result = await db.collection('fang_travel').count();
    this.setData({
      total: result.total
    });
    wx.showLoading({
      title: '正在加载...',
      mask: true
    });
    db.collection('fang_travel').orderBy('createTime', 'desc').limit(that.data.pageSize).get().then(res=>{
      wx.hideLoading();
      wx.stopPullDownRefresh();
      that.setData({
        fangTarvelList: res.data,
        hasMore: res.data.length < that.data.total ? true : false
      });
    }).catch(err=>{
      console.error(err);
    });
  },
  // 上拉加载更多
  onReachBottom(){
    const that = this;
    const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
    
    // 获取下一页数据
    if (that.data.fangTarvelList.length < that.data.total) {
      wx.showLoading({
        title: '正在加载...',
        mask: true
      });
      db.collection('fang_travel').orderBy('createTime', 'desc')
        .skip(that.data.page * that.data.pageSize)
        .limit(that.data.pageSize).get()
        .then(res=>{
          wx.hideLoading();
          if (res.data.length) {
            that.setData({
              fangTarvelList: that.data.fangTarvelList.concat(res.data),
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
    db.collection('fang_travel').where({
      destination: db.RegExp({
        regexp: that.data.searchValue,//做为关键字进行匹配
        options: 'i',//不区分大小写
      })
    }).get().then(res=>{
      wx.hideLoading();
      that.setData({
        fangTarvelList: res.data
      });
    }).catch(err=>{
      wx.hideLoading();
    })
  },
  onShow(){
    this.getTravelList();
  },
  onLoad(){
    this.getTravelList();
  },
  // 下拉刷新
  onPullDownRefresh(){
    this.setData({
      searchValue: ''
    });
    this.getTravelList();
  },
  onClose(event){
    const that = this;
    const { position, instance } = event.detail;
    const { item } = event.currentTarget.dataset;
    switch (position) {
      case 'left':
        wx.navigateTo({
          url: "/pages/destination/destination?item=" + JSON.stringify(item)
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
          const imgId = item.travelUrl;
          db.collection('fang_travel').doc(rowId).remove().then(res=>{
            // 删除数据 同时删除云存储的图片文件
            if (imgId) {
              wx.cloud.deleteFile({
                fileList: [imgId]
              }).then(res=>{}).catch(err=>{
                console.error(err);
              });
            }
            Notify({ type: 'success', message: '删除成功' });
            instance.close();
            this.getTravelList();
          }).catch(err=>{
            Notify({ type: 'warning', message: '删除失败' });
            instance.close();
          });
        }).catch(()=>{});
        break;
    }

  }
})