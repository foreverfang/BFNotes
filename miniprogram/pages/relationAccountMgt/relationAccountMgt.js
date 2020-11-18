import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog';
import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify';
const REMAIN_ACCOUNT = '余账'; // ta欠我人情 
const OWE_ACCOUNT = '差账'; // 还欠ta人情
const LEVEL_ACCOUNT = '平账'; 
let globalAccountDetailList = []; // 存明细数据备份
let gGiveTotal = 0;
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
    givePageSize: 10, // 随礼每页显示条数
    givePage: 1, // 随礼当前页
    giveHasMore: true,
    accountInfoString: '',
    defaultAvatar: 'cloud://scallop-2g4ppt2ya3b48261.7363-scallop-2g4ppt2ya3b48261-1303979843/defaultAvatar.jpg',
    searchValue: '',
    accountDetailList: [], // 随礼收礼汇总明细 
    accountDetailTotal: 0, // 随礼收礼总条数
    detailInfoString: '',
    detailSearchValue: ''
  },
  onShow(){
    this.getAccountReceiveList();
    this.getAccountGiveList();
    this.getAccountDetailList();
    this.setData({
      receivePage: 1,
      givePage: 1,
      searchValue: '',
      detailSearchValue: '',
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
    const accountRes = await db.collection('fang_account_receive').orderBy('createTime', 'desc').limit(that.data.receivePageSize).get();
    wx.hideLoading();
    wx.stopPullDownRefresh();
    if (accountRes.data) {
      // 获取账本所有数据
      const accountData = await that.formatAccountList(accountRes.data);
      that.setData({
        receiveAccountList: accountData,
        receiveHasMore: accountRes.data.length < that.data.receiveTotal ? true : false
      });
    } else {
      Notify({ type: 'danger', message: accountData });
    }
  },
  // 账本数据格式化
  async formatAccountList(data){
    let dataset = [];
    for (let i = 0; i < data.length; i++) {
      // 获取当前账本所属的所有数据
      const item = await this.getAccountAllUsers(data[i]._id);
      const itemData = item.data;
      let moneyList = []; // 金额list
      itemData.forEach(ele=>{
        moneyList.push(ele.money);
      });
      let totalMoney = parseFloat(0).toFixed(2);
      if (moneyList.length) {
        // 计算账本总金额，保留2位小数
        totalMoney = parseFloat(moneyList.reduce((cur, pre)=> parseFloat(cur) + parseFloat(pre))).toFixed(2); 
      }
      dataset.push(Object.assign({}, data[i], { totalMoney: totalMoney }));
    }
    return dataset;
  },

  /**
   * 查账本所属的所有数据，便于计算总金额
   * accountId 账本id
   */ 
  async getAccountAllUsers(accountId) {
    const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
    const PAGE_SIZE = 20; // 每次查20条
    const result =  await db.collection('fang_receive_users').where({
      accountId: accountId // 筛选当前账本的数据
    }).count(); // 查总共多少条数据
    const total = result.total;
    const batchTimes = Math.ceil(total/PAGE_SIZE); // 计算分几次取数据
    const tasks = [];
    wx.showLoading({
      title: '正在加载...',
      mask: true
    });
    for(let i =0; i < batchTimes; i++){
      const promise = db.collection('fang_receive_users').where({ accountId: accountId }).skip(i*PAGE_SIZE).limit(PAGE_SIZE).get();
      tasks.push(promise);
    }
    const resultData = await Promise.all(tasks); 
    wx.hideLoading();
    if (resultData.length <=0) {
      return { data: []};
    }
    return resultData.reduce((pre, cur)=>{
      return {
        data: pre.data.concat(cur.data)
      };
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
      db.collection(collectionName).orderBy('createTime', 'desc').skip(that.data[page] * that.data[pageSize]).limit(that.data[pageSize]).get()
        .then(res=>{
          wx.hideLoading();
          if (res.data.length) {
            that.setData({
              [list]: tabName === 'give' ? that.formatList(that.data[list].concat(res.data), 'moneyBack') : that.data[list].concat(res.data),
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
  async onReachBottom(){
    if (this.data.activeAccount === 'receive' || this.data.activeAccount === 'give') {
      if(this.data.activeAccount === 'give') {
        const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
        const result = await db.collection('fang_give_users').count();
        this.setData({
          giveTotal: result.total
        });
      }
      this.getMoreData(this.data.activeAccount);
    }
  },
  onTabChange(e){
    const tabName = e.detail.name;
    this.setData({
      activeAccount: tabName,
      receivePage: 1,
      givePage: 1,
      searchValue: '',
      detailSearchValue: '',
      accountInfoString: JSON.stringify({accountType: 'give', accountId: ""})
    });
    switch(tabName) {
      case 'receive':
        this.getAccountReceiveList();
        break;
      case 'give':
        this.getAccountGiveList();
        break;
      case 'detail':
        this.getAccountDetailList();
        break;
      default:
        break;
    }
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
          message: '删除账本，该账本相关的数据也会被全部清空，确定删除吗？'
        }).then(() => {
          const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
          const rowId = item._id;
          // 删除账本 
          db.collection('fang_account_receive').doc(rowId).remove().then(res=>{
            // 删除账本关联的数据
            wx.cloud.callFunction({
              name: 'batchdel',
              data: {
                accountId: rowId
              }
            }).then(resp=>{
              Notify({ type: 'success', message: '删除成功' });
              instance.close();
              that.setData({
                receivePage: 1
              });
              that.getAccountReceiveList();
            }).catch(err=>{
              instance.close();
              console.error("账本内部数据删除失败：", err);
            })
          }).catch(err=>{
            Notify({ type: 'warning', message: '删除失败' });
            instance.close();
          });
        }).catch(()=>{});
        break;
    }
  },

  // 下拉刷新
  onPullDownRefresh(){
    if (this.data.activeAccount === 'receive') {
      this.getAccountReceiveList();
    } else if (this.data.activeAccount === 'give') {
      this.setData({
        searchValue: '',
        givePage: 1
      });
      this.getAccountGiveList();
    } else if (this.data.activeAccount === 'detail') {
      this.setData({
        detailSearchValue: ''
      });
      this.getAccountDetailList();
    }
  },
  // 格式化金额
  formatList(data, nameProp){
    let dataset = [];
    data.forEach(item=>{
      item[nameProp] = parseFloat(item[nameProp]).toFixed(2);
      dataset.push(item);
    })
    return dataset;
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
    gGiveTotal = result.total;
    wx.showLoading({
      title: '正在加载...',
      mask: true
    });
    db.collection('fang_give_users').orderBy('createTime', 'desc').limit(that.data.givePageSize).get().then(res=>{
      wx.hideLoading();
      wx.stopPullDownRefresh();
      that.setData({
        giveUsersList: that.formatList(res.data, 'moneyBack'),
        giveHasMore: res.data.length < that.data.giveTotal ? true : false
      });
    }).catch(err=>{
      wx.hideLoading();
      Notify({ type: 'danger', message: err });
    });
  },
  // 随礼搜索
  onSearch(){
    const that = this;
    const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
    wx.showLoading({
      title: '正在加载...',
      mask: true
    });
    db.collection('fang_give_users').orderBy('createTime', 'desc').where({
      name: db.RegExp({
        regexp: that.data.searchValue,//做为关键字进行匹配
        options: 'i',//不区分大小写
      })
    }).limit(that.data.givePageSize).get().then(res=>{
      wx.hideLoading();
      that.setData({
        giveUsersList: that.formatList(res.data, 'moneyBack'),
        giveTotal: res.data.length,
        giveHasMore: (!that.data.searchValue && res.data.length < gGiveTotal) ? true : false, // 空搜索情况
        givePage: 1
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
      db.collection('fang_give_users').doc(rowId).remove({
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
          that.setData({
            givePage: 1,
            searchValue: ''
          });
          that.getAccountGiveList();
        },
        fail: err=>{
          Notify({ type: 'danger', message: '删除失败' });
        }
      });
    }).catch(()=>{});
  },

  /**
   * 明细
   * 获取随礼/收礼所有数据
   * @param {string} collectionName 集合名称
   */
  async getAllData(collectionName) {
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
    const resultData = await Promise.all(tasks); 
    wx.hideLoading();
    if (resultData.length <=0) {
      return { data: []};
    }
    return resultData.reduce((pre, cur)=>{
      return {
        data: pre.data.concat(cur.data)
      };
    });
  },
  // 随礼收礼数据汇总
  async getAccountDetailList(){
    const receiveRes = await this.getAllData('fang_receive_users'); // 收礼数据
    const giveRes = await this.getAllData('fang_give_users'); // 随礼数据
    const receiveData = receiveRes.data;
    const giveData = giveRes.data;
    // console.log("收礼receiveData=", receiveData);
    // console.log("随礼giveData=", giveData);

    // 按人名 数据汇总 
    const accountTotalData = receiveData.concat(giveData);
    // console.log("汇总收礼随礼数据accountTotalData=", accountTotalData);
    // 以个人为维度，统计个人数据（有多少人情往来）
    let personObj = {};
    for (let i = 0; i < accountTotalData.length; i++) {
      const pItem = accountTotalData[i];
      personObj[pItem.name] = pItem._id;
    }
    // 人名数组
    let personList = [];
    for (let name in personObj) {
      personList.push(name);
    }
    let dataset = [];
    // 明细汇总
    for (let k = 0; k < personList.length; k++) {
      let receiveList = []; // 个人收礼详情
      let giveList = []; // 个人随礼详情
      let receiveMoneyList = []; // 个人收礼金额list
      let giveMoneyList = []; // 个人随礼金额list
      const pName = personList[k];
      
      for (let m = 0; m < accountTotalData.length; m++) {
        const aItem = accountTotalData[m];
        // 个人数据
        if (pName === aItem.name) {
          if (aItem.accountType === 'receive') { // 收礼
            aItem.money = parseFloat(aItem.money).toFixed(2);
            receiveList.push(aItem);
            receiveMoneyList.push(aItem.money);
          } else if (aItem.accountType === 'give') { // 随礼
            aItem.moneyBack = parseFloat(aItem.moneyBack).toFixed(2);
            giveList.push(aItem);
            giveMoneyList.push(aItem.moneyBack);
          }
          
        }
      }
      const receiveTotal = this.getSum(receiveMoneyList); // 收礼总额
      const giveTotal = this.getSum(giveMoneyList); // 随礼总额
      const difference =parseFloat(receiveTotal - giveTotal).toFixed(2); // 差额
      let status = '';
      let tagType = '';
      if (parseFloat(difference) === 0) {
        status = LEVEL_ACCOUNT;
        tagType = 'primary';
      } else if (difference > 0) {
        status = OWE_ACCOUNT; // 还欠ta人情
        tagType = 'danger';
      } else if (difference < 0) {
        status = REMAIN_ACCOUNT; // ta欠我人情 
        tagType = 'success';
      }
      const dataItem = {
        name: pName,
        receiveList: receiveList,
        giveList: giveList, 
        receiveTotal: receiveTotal, // 个人收礼总额
        giveTotal: giveTotal, // 个人随礼总额
        difference: difference, // 差额
        status: status,
        tagType: tagType
      };
      // 存一份JSON字符串，便于跳转传参
      const accountInfoString = JSON.stringify(dataItem);
      const datasetItem = Object.assign({}, dataItem, { accountInfoString: accountInfoString });
      dataset.push(datasetItem);
    }
    // console.log("个人随礼收礼总数据dataset=", dataset);
    wx.stopPullDownRefresh();
    this.setData({
      accountDetailList: dataset,
      accountDetailTotal: dataset.length
    });
    // 存总数据备份，便于搜索
    globalAccountDetailList = JSON.parse(JSON.stringify(this.data.accountDetailList))
  },
  // 求和
  getSum(data){
    const sum = data.length ? data.reduce((cur, pre)=>parseFloat(cur) + parseFloat(pre)) : 0;
    return parseFloat(sum).toFixed(2);
  },
  // 搜索框事件
  onDetailChange(e){
    this.setData({
      detailSearchValue: e.detail
    });
  },
  // 明细搜索
  onDetailSearch(){
    wx.showLoading({
      title: '正在加载...',
      mask: true
    });
    const value = this.data.detailSearchValue;
    if (value || value === "0") {
      let searchResultList = [];
      const data = globalAccountDetailList;
      for (let i = 0; i< data.length; i++) {
        if (data[i].name.indexOf(value) > -1) {
          searchResultList.push(data[i]);
        } 
      }
      this.setData({
        accountDetailList: searchResultList, // 符合条件的数据
        accountDetailTotal: searchResultList.length
      });
    } else {
      this.setData({
        accountDetailList: globalAccountDetailList, // 空搜索，数据还原
        accountDetailTotal: globalAccountDetailList.length
      });
    }
    setTimeout(()=>{
      wx.hideLoading();
    }, 500)
  }
})