
const { app, BrowserWindow, ipcMain, Tray, Menu, window } = require('electron')
const Store = require('electron-store')
const notifier = require("node-notifier")

//全局创建窗口、托盘、储存对象
let win = null
let tray = null
const store = new Store()

nowAddTuid = store.get('setting.global.nowtuid')

//初始化主窗口和托盘图标
function createWindow () {  
  // 创建浏览器窗口
  win = new BrowserWindow({
    frame: false,
    resizable: false,
    show:false,
    width: 800,
    height: 600,
    icon:"./lib/icon/logo/logo_s.ico",
    webPreferences: {
      nodeIntegration: true
    }
  })

  // 加载index.html文件
  win.loadFile('index.html')

  //加载托盘图标，显示窗口
  win.on('ready-to-show',function(){
    //创建任务栏托盘
    tray = new Tray('./lib/icon/logo/logo_s.ico')
    const contextMenu = Menu.buildFromTemplate([
      { label: '主界面', click:() => {win.webContents.executeJavaScript('location.href = "#nowaday"');win.show();}},
      { label: '设置', click:() => {win.webContents.executeJavaScript('location.href = "#setting"');win.show();}},
      { label: '退出', click:() => {win.close()}}
    ])
    tray.setToolTip('Attenow\nAttention to Now')
    tray.setContextMenu(contextMenu)
    tray.on('click',() => {
      win.webContents.executeJavaScript('location.href = "#nowaday"')
      win.show()
    })
    win.show()
    //启动任务监视器
    setInterval(checkIfTask,6000)
    //开启开发者模式
    //win.webContents.openDevTools()
  })
}

//初始化事件监听器
function initEventOn(){
  //窗口最小化监听
  ipcMain.on('win-close', e=> {win.hide();win.reload();})

  //任务信息传递
  ipcMain.on('tasklist-message',(event,order,task,tuid)=> {

    //返回任务列表
    if (order == 'get'){
      event.sender.send('tasklist-reply','ret',readTaskList())
    } 

    //删除指定任务
    else if (order == 'del'){
      store.delete('task.'+tuid)
      event.sender.send('tasklist-reply','ret',readTaskList())
    } 

    //添加任务
    else if (order == 'add'){
      //储存该任务
      store.set("task."+nowAddTuid,task)
      //刷新tuid
      newtuid = parseInt(nowAddTuid,10)+1
      newtuidStr = Array(9999>newtuid?(4-(''+newtuid).length+1):0).join(0)+newtuid
      store.set('setting.global.nowtuid',newtuidStr+'')
      nowAddTuid = store.get('setting.global.nowtuid')
      event.sender.send('tasklist-reply','ret',readTaskList())
    }

    //修改任务
    else if (order == 'set'){
      store.set("task."+tuid,task)
      event.sender.send('tasklist-reply','ret',readTaskList())
    }
  })
}

//发送win10toast通知
function sendToast(titletext,messagetext){
  notifier.notify(
    {
      appId:'attenow',
      title: titletext,
      message: messagetext,
      icon:"./lib/icon/logo/logo.ico",
      sound: true,
      wait: false
    },
    function(err, response) {
      // Response is response from notification
      console.log("Show a win10toast");
    }
  )
}

//返回任务json列表
function readTaskList(){
  return store.get('task')
}

//检查是否有任务需提醒
function checkIfTask(){
  console.log(Date())
}

app.setAppUserModelId("attenow") 
initEventOn() 
app.whenReady().then(createWindow)

sendToast('Attenow启动了','Attenow, Attention to Now!')

//store.set(tasklist)