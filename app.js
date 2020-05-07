var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

let users = []

server.listen(8081,()=>{
    console.log("服务器已启动。。。")
});

app.use('/public',require('express').static('public'))

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  socket.on('login', (data)=>{
    //console.log(data)
    // 判断登录是否冲突
    let user = users.find(item => item.userName === data.userName)
    if(user){
        // 登录失败,账户已被登录
        socket.emit('loginErr',{err:'登录失败'})
    }else{
        // 登录成功
        users.push(data)
        socket.emit('loginSucces',data)
    }

    // 添加广播消息，告诉所有人此人加入该群聊
    io.emit('addUser',data)

    // 广播消息：获取用户列表和用户数量
    io.emit('userItem',users)

    // 监听用户断开链接时候数据
    socket.userName = data.userName;
    socket.avatar = data.avatar
  });

  // 用户断开链接
  socket.on('disconnect',()=>{
    // 把当前用户信息删除
    let dtlId = users.findIndex(item => item.userName === socket.userName);
    users.splice(dtlId,1)
    //告诉所有人，有人离开
    io.emit('dtlUser',{
      userName: socket.userName,
      avatar:socket.avatar
    })
    //告诉所有人，list发现更新
    io.emit('userItem',users)
  })

  //监听聊天
  socket.on('sendMsg',data => {
    //服务器获取数据之后，广播给所有用户
    io.emit('receiveMsg',data)
  })

  //监听图片信息
  socket.on('sendImg',data => {
    //服务器获取数据之后，广播给所有用户
    io.emit('receiveImg',data)
  })
});