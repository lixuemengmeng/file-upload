var fs = require('fs');
var path = require('path');
var Koa = require('koa');
var KoaRouter = require('koa-router');
var koaStatic = require('koa-static');
var koaBody = require('koa-body');

var conf = {
    tempPath: path.resolve(__dirname, 'temp'),
    staticPath: path.resolve(__dirname, 'static')
};

var app = new Koa();
var router = new KoaRouter();
var uploadHost= `http://lixuemeng01.baijiahao.baidu.com:8100/static/`;
router.options('/upload', ctx => {
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    ctx.set('Access-Control-Allow-Headers', '*');
    ctx.body = {
        errno: 0
    }
});
router.post('/upload', ctx => {
    console.log(ctx.request);
    let files = ctx.request.files.f1;
    var result=[];
    // const {request: { body } } = ctx;
    // const title = body.title;
    if(files &&  !Array.isArray(files)){//单文件上传容错
        files=[files];
    }
    files && files.forEach(item=>{
        var {path, name, size} = item;
        if(size>0 && path){
            var nextPath = `${conf.staticPath}/${name}`;
            //重命名文件
            fs.renameSync(path, nextPath);
            var fileUrl = `${uploadHost}${nextPath.slice(nextPath.lastIndexOf('/')+1)}`;
            result.push(fileUrl);
        }
    });
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    ctx.set('Access-Control-Allow-Headers', '*');
    ctx.body = { 
        errno: 0,
        "fileUrl":result
    };
    
})
// 允许直接访问静态资源  http://lixuemeng01.baijiahao.baidu.com:8100/static/b219157c3adbe05161761ee33.jpeg
app.use(koaStatic(__dirname));

// 启动 koaBody
// multipart: true 用于解析 enctype="multipart/form-data"
// formidable: 给内部插件 formidable 的配置 
app.use(koaBody({
    multipart: true,
    formidable: {
        uploadDir: conf.staticPath
    }
}))

// 使用路由
app.use(router.routes(), router.allowedMethods())

// 监听端口号, 启动服务器
app.listen(8100, () => {
    console.log(`the server is running on 8100`)
})