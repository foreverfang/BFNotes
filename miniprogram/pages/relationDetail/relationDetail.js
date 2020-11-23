import * as echarts from '../../lib/ec-canvas/echarts';
let receiveChart = null;
let giveChart = null;

function initReceiveChart(canvas, width, height, dpr) {
  receiveChart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr // new
  });
  canvas.setChart(receiveChart);
  const option = {
    color: [
      '#409EFF', '#007d65', '#45b97c', '#decb00', '#2585a6', '#33a3dc', '#de773f', '#3e4145', '#7bbfea', '#f15a22', '#c77eb5', '#1b315e', '#7c8577', '#65c294', '#ed1941', '#6950a1'
    ],
    title: {
      x: 'center',
      text: "收礼统计",
      padding: 5,
      textStyle: {
        fontSize: 18,
        fontWeight: 'bolder',
        color: '#d93a49' // 主标题文字颜色
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: "{a} {b}: ￥{c} ({d}%)"
    },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      left: 'center',
      bottom: '20', //图例底部距离
      itemGap: 10, //图例间距
      textStyle: {
        color: '#c8c8d0'
      },
      data: ''
    },
    series: [{
      name: '',
      type: 'pie',
      radius: '50%',
      center: ['50%', '50%'],
      label: {
        normal: {
          show: true,
          position: 'outside',
          formatter: '{b}:{c}元'
        },
        emphasis: {
          show: true,
          textStyle: {
            fontSize: '20',
            fontWeight: 'bold'
          }
        }
      },
      data: []
    }]
  };

  receiveChart.setOption(option);
  return receiveChart;
}

// 随礼饼图初始化
function initGiveChart(canvas, width, height, dpr) {
  giveChart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr // new
  });
  canvas.setChart(giveChart);
  const option = {
    color: [
      '#409EFF', '#007d65', '#45b97c', '#decb00', '#2585a6', '#33a3dc', '#de773f', '#3e4145', '#7bbfea', '#f15a22', '#c77eb5', '#1b315e', '#7c8577', '#65c294', '#ed1941', '#6950a1'
    ],
    title: {
      x: 'center',
      text: "随礼统计",
      padding: 5,
      textStyle: {
        fontSize: 18,
        fontWeight: 'bolder',
        color: '#d93a49' // 主标题文字颜色
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: "{a} {b}: ￥{c} ({d}%)"
    },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      left: 'center',
      bottom: '20', //图例底部距离
      itemGap: 10, //图例间距
      textStyle: {
        color: '#c8c8d0'
      },
      data: ''
    },
    series: [{
      name: '',
      type: 'pie',
      radius: '50%',
      center: ['50%', '50%'],
      label: {
        normal: {
          show: true,
          position: 'outside',
          formatter: '{b}:{c}元'
        },
        emphasis: {
          show: true,
          textStyle: {
            fontSize: '20',
            fontWeight: 'bold'
          }
        }
      },
      data: []
    }]
  };

  giveChart.setOption(option);
  return giveChart;
}

Page({
  data: {
    activeAccount: 'receive',
    receiveEc: {
      onInit: initReceiveChart
    },
    giveEc: {
      onInit: initGiveChart
    },
    totalAmountReceive: 0,
    totalAmountGive: 0
  },
  onTabChange(e){
    const that = this;
    that.setData({
      activeAccount: e.detail.name
    });
    if (e.detail.name === 'give') {
      setTimeout(function () {
        that.getEchartsInfo('fang_give_users');
      }, 500)
    } else {
      setTimeout(function () {
        that.getEchartsInfo('fang_receive_users');
      }, 500)
    }
  },
  onLoad(options) {},
  onShow: function () {
    var that = this;
    setTimeout(function () {
      that.getEchartsInfo('fang_receive_users');
    }, 500)
  },
  onUnload(){},
  // 获取收礼/随礼统计图表全部数据
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
    if (relationResult.length <=0) {
      return { data: [] };
    }
    return relationResult.reduce((pre, cur)=>{
      return {
        data: pre.data.concat(cur.data)
      };
    });
  },
  /**
   * 获取全部数据，绘制饼图 
   * collectionName 数据库集合名称
   * nameProp 金额属性名
   */
  async getEchartsInfo(collectionName){
    const that = this;
    const relationList = await that.getUsersAll(collectionName);
    const totalAmount = collectionName === "fang_receive_users" ? "totalAmountReceive" : "totalAmountGive";
    const nameProp = collectionName === "fang_receive_users" ? "money" : "moneyBack";
    const currentChart = collectionName === "fang_receive_users" ? receiveChart : giveChart;
    const option = currentChart.getOption();
    const echartsData = relationList.data;
    let legendList = [];
    let dataset = [];
    let moneyList = [];
    for(let i = 0; i < echartsData.length; i++) {
      const dataItem = echartsData[i];
      const money = dataItem[nameProp];
      legendList.push(dataItem.name);
      dataset.push({
        name: dataItem.name,
        value: money
      });
      moneyList.push(money);
    }
    option.legend.data = legendList;
    option.series[0].data = dataset;
    currentChart.setOption(option, true);
    that.setData({
      [totalAmount]: parseFloat(moneyList.reduce((prev, curr)=> parseFloat(prev) + parseFloat(curr))).toFixed(2)
    });
  }
})