//electron中导入
const { ipcRenderer } = require('electron')
taskList = {}
nowEditTuid = ''

function getTaskList(){
    ipcRenderer.send('tasklist-message', 'get')
}

function addTask(title,caption,time,tag){
    taskAdded = {'title':title,'caption':caption,'time':time,'tag':tag}
    ipcRenderer.send('tasklist-message', 'add', taskAdded)
}

function setTask(tuid,title,caption,time,tag){
    taskAdded = {'title':title,'caption':caption,'time':time,'tag':tag}
    ipcRenderer.send('tasklist-message', 'set', taskAdded, tuid)
}

function delTask(tuid){
    ipcRenderer.send('tasklist-message', 'del', {}, tuid)
}

//渲染任务列表
function refreshTaskCard(){
    var taskCard = document.getElementsByClassName('task-card')
    for(var i = taskCard.length - 1; i >= 0; i--) { 
        taskCard[i].parentNode.removeChild(taskCard[i]); 
    }
    //组合成task-card
    var maxCaptionLen = 12
    str1 = '<img class="task-ok-button" src="./lib/icon/todo.png"/><div class="task-text"><div class="task-text-title">'
    str2 = '</div><div class="task-text-caption">'
    str3 = '</div><div class="task-text-time">'
    str4 = '</div><div class="task-text-tag">'
    str5 = '</div></div><img class="task-edit-button" src="./lib/icon/edit.png" onclick="changeEditCover(true,this.parentNode)"/>'    
    for (var tuid in taskList){
        var taskCard = document.createElement("div")
        taskCard.className = "task-card"
        taskCard.id = tuid
        strCaption = (taskList[tuid]['caption'].length>maxCaptionLen ? taskList[tuid]['caption'].substring(0,maxCaptionLen-1)+"...&nbsp;&nbsp;&nbsp;" : (taskList[tuid]['caption']==''?'':taskList[tuid]['caption']+"&nbsp;&nbsp;&nbsp;"))
        taskCard.innerHTML = str1 + taskList[tuid]['title'] + str2 + strCaption + str3 + taskList[tuid]['time'] + str4 + str5 + taskList[tuid]['tag']
        document.getElementById('nowaday').appendChild(taskCard)
    }
}

//显示/隐藏任务编辑页面
function changeEditCover(ifSeen,TaskCardObject){
    if(ifSeen == true){
        nowEditTuid = TaskCardObject.id
        //设置输入框内容
        document.getElementsByClassName('task-edit-input')[0].value = taskList[nowEditTuid]['title']
        document.getElementsByClassName('task-edit-input')[1].value = taskList[nowEditTuid]['caption']
        document.getElementsByClassName('task-edit-input')[2].value = taskList[nowEditTuid]['time']
        document.getElementsByClassName('task-edit-input')[3].value = taskList[nowEditTuid]['tag']
        //显示出任务编辑页面
        document.getElementsByClassName('task-edit-cover')[0].style.opacity = "0.6"
        document.getElementsByClassName('task-edit-card')[0].style.visibility = "visible"
        document.getElementsByClassName('task-edit-card')[0].style.opacity = "1.0"
    } else {
        nowEditTuid = ''
        //隐藏任务编辑页面
        document.getElementsByClassName('task-edit-cover')[0].style.opacity = "0.0"
        document.getElementsByClassName('task-edit-card')[0].style.visibility = "hidden"
        document.getElementsByClassName('task-edit-card')[0].style.opacity = "0.0"
    }
}

//编辑确定按钮点击事件 => 向主进程修改任务
function editSubmitButtonClicked(EditCardObject){
    title = EditCardObject.children[0].children[1].value
    caption = EditCardObject.children[1].children[1].value
    time = EditCardObject.children[2].children[1].value
    tag = EditCardObject.children[3].children[1].value
    if (nowEditTuid != ''){
        setTask(nowEditTuid,title,caption,time,tag)
    }
    changeEditCover(false,EditCardObject)
}

//编辑删除按钮点击事件 => 删除储存的任务
function editDeleteButtonClicked(){
    delTask(nowEditTuid)
    nowEditTuid = ''
    changeEditCover(false,{'id':''})
}

//添加按钮点击事件 => 展开特效、向主进程添加新任务
function addButtonClicked(){
    var currentAngle = 0
    var ifFold = true
    document.getElementsByClassName('task-add-button')[0].onclick = function(){   
        //添加按钮旋转特效
        currentAngle = currentAngle + 180
        this.style.transform = 'rotate('+currentAngle+'deg)'
        if (ifFold == false){
            //收回元素
            document.getElementsByClassName('task-add-card')[0].style.clipPath = 'circle(5% at 96% 50%)'
            document.getElementsByClassName('task-add-card')[0].style.backgroundColor = '#C9D6DF'
            //若输入不为空，添加并渲染新任务
            if(document.getElementsByClassName('task-add-input')[0].value != ''){
                //调用添加任务函数
                addTask(document.getElementsByClassName('task-add-input')[0].value,'','At 2020.2.29.',"个人项目&凌霜计划")
                //置空输入框
                document.getElementsByClassName('task-add-input')[0].value = ''
            }
        } else {
            //展开元素
            document.getElementsByClassName('task-add-card')[0].style.clipPath = 'circle(80%)'
            document.getElementsByClassName('task-add-card')[0].style.backgroundColor = '#F0F5F9'
        }
        ifFold= !ifFold
    }
}

//从任务栏访问时重定向
ipcRenderer.on('win-control',function(event,order){
    if (order == 'setting'){
        window.location.href("index#setting")
    } else if (order == 'nowaday'){
        window.location.href("nowaday")
    }
})

//接收任务列表并进行渲染    
ipcRenderer.on('tasklist-reply', function(event,reply,task) {
    if (reply == 'ret'){
        taskList = task
        refreshTaskCard()
    }
})

window.onload = function(){
    addButtonClicked()
    getTaskList()
    initCalendar()
}