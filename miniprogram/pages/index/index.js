//获取应用实例
const app = getApp()

Page({
  data: {
    motto: 'Hello Fang',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    interval: 2000,
    indexImgList: [],
    imgList: [
      { travelUrl: 'cloud://scallop-2g4ppt2ya3b48261.7363-scallop-2g4ppt2ya3b48261-1303979843/index2.jpg'},
      { travelUrl: 'cloud://scallop-2g4ppt2ya3b48261.7363-scallop-2g4ppt2ya3b48261-1303979843/index3.jpg'},
      { travelUrl: 'cloud://scallop-2g4ppt2ya3b48261.7363-scallop-2g4ppt2ya3b48261-1303979843/index4.jpg'}
    ],
    favorReceiveList: [], // 收礼一览列表
    favorGiveList: [], // 随礼一览列表
    receiveTotalList: {}, // 收礼总计信息
    giveTotalList: {}, // 随礼总计信息
  },
  // 下拉刷新
  onPullDownRefresh(){
    wx.stopPullDownRefresh();
  },
  // 查环游世界表
  getTravelList(){
    const that = this;
    const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
    wx.showLoading({
      title: '正在加载...',
      mask: true
    });
    db.collection('fang_travel').get().then(res=>{
      wx.hideLoading();
      const len = res.data.length;
      let imgList = [];
      if (len>=4) {
        imgList = res.data.splice(len - 4);
      } else {
        imgList = res.data.length ? res.data : that.data.imgList
      }
      that.setData({
        indexImgList: imgList
      });
    }).catch(err=>{
      console.error(err);
    });
  },
  onShow(){
    // 首页轮播图
    this.getTravelList();
    // 首页账本统计
    this.getReceiveList();
    this.getGiveList();
  },
  onLoad() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        console.log("用户信息2：",res.userInfo);
        wx.setStorage({
          key:"userInfo",
          data:res.userInfo
        })
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  // 获取收礼/随礼全部数据
  async getUsersAll(collectionName) {
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
    const relationResult = await Promise.all(tasks); 
    wx.hideLoading();
    if (!relationResult.length) {
      return { data: [] };
    }
    return relationResult.reduce((pre, cur)=>{
      return {
        data: pre.data.concat(cur.data)
      };
    });
  },
  // 求和
  getSum(data){
    const sum = data.reduce((cur, pre)=>parseFloat(cur) + parseFloat(pre));
    return sum ? parseFloat(sum).toFixed(2) : 0.00;
  },
  // 根据年份汇总随礼和收礼数据
  getTotalData(data, nameProp){
    let totalData = []; // 最终展示的数据
    let dataset = []; // 汇总的数据
    let yearList = []; // 年份数组
    let yearObj = {}; // 获取所有的年份，不重复
    for(let i = 0; i < data.length; i++) {
      const dataItem = data[i];
      yearObj[dataItem.year] = dataItem._id;
    }
    for(let item in yearObj) {
      yearList.push(item);
    }
    for(let i = 0; i < yearList.length; i++){
      let currentYearData = [];
      for(let j = 0; j < data.length; j++){
        if (yearList[i] === data[j].year + '') {
          //金额按年份汇总
          currentYearData.push(data[j][nameProp]);
        }
      }
      dataset.push({
        year: yearList[i],
        moneyList: currentYearData
      });
    }
    dataset.forEach(item=>{
      totalData.push({
        year: item.year,
        totalMoney: this.getSum(item.moneyList)
      });
    });
    return totalData;
  },
  // 获取收礼账本所有数据
  async getReceiveList(){
    const result = await this.getUsersAll('fang_receive_users');
    // 收礼统计汇总
    this.setData({
      receiveTotalList: this.getTotalData(result.data, 'money')
    }); 
    const resultData = result.data.sort((a,b)=>a.money-b.money);
    const len = resultData.length;
    let list = [];
    // 前三名
    if (len >= 3 ) {
      list = resultData.splice(len-3)
    } else {
      list = resultData.splice(len)
    }
    this.setData({
      favorReceiveList: list
    });
  },

  // 获取收礼账本所有数据
  async getGiveList(){
    const result = await this.getUsersAll('fang_give_users');
    // 随礼统计汇总
    this.setData({
      giveTotalList: this.getTotalData(result.data, 'moneyBack')
    }); 
    const resultData = result.data.sort((a,b)=>a.moneyBack-b.moneyBack);
    const len = resultData.length;
    let list = [];
    // 前三名
    if (len >= 3 ) {
      list = resultData.splice(len-3)
    } else {
      list = resultData.splice(len)
    }
    this.setData({
      favorGiveList: list
    });
  },

  onUnload: function() {
    // 页面销毁时执行
    wx.clearStorage();
  },
  onShareAppMessage() {
    const that =this;
    const users = wx.getStorageSync('user');
    console.log("users:",users);
    return {
      title: 'BF随记分享', // 转发后 所显示的title
      path: '/pages/index/index', // 相对的路径
      success: (res)=>{ },
      fail: (err) => {
        // 分享失败
        console.log(err)
      }
    }
  }
})