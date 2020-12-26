var fs = require('fs');
var path = require('path');
var Koa = require('koa');
var KoaRouter = require('koa-router');
var koaStatic = require('koa-static');
var koaBody = require('koa-body');
const fse = require("fs-extra");

var conf = {
    tempPath: path.resolve(__dirname, 'temp'),
    staticPath: path.resolve(__dirname, 'static'),
    chunkTemp: path.resolve(__dirname, 'chunk-temp')
};

var app = new Koa();
var router = new KoaRouter();
var uploadHost= `http://lixuemeng01.baijiahao.baidu.com:8100/static/`;

router.get('/upload/chunkCheck', ctx => {
    const query = ctx.request.query;
    const {md5, id} = query;
    const newChunkPath = `${conf.chunkTemp}/${md5}/${id}`;
    let isAlready = false
    if (fse.existsSync(newChunkPath)) {
        isAlready = true;
    }
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    ctx.set('Access-Control-Allow-Headers', '*');
    ctx.body = { 
        errno: 0,
        isAlready
    };

})
router.get('/upload/fileCheck', ctx => {
    const query = ctx.request.query;
    const {md5} = query;
    const newChunkPath = `${conf.staticPath}/${md5}`;
    console.log(newChunkPath);
    let body = {
        errno: 1
    }
    if (fse.existsSync(newChunkPath)) {
        body = {
            errno: 0,
            data: `${uploadHost}/${md5}` 
        }
    }
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    ctx.set('Access-Control-Allow-Headers', '*');
    ctx.body = body;

})

router.post('/upload/uploadChunk', async ctx => {
    const {params,query,request: {body, files}} = ctx;
    const {hash, id} = body;
    const file = files.chunk;
    var {path} = file || {};
    // chunk存储文件夹 已hash值为文件夹名字
    const ChunkDir = `${conf.chunkTemp}/${hash}`;
    // 每个chunk的路径
    const newChunkPath = `${conf.chunkTemp}/${hash}/${id}`;
    // 切片目录不存在，创建切片目录
    if (!fse.existsSync(ChunkDir)) {
        await fse.mkdirs(ChunkDir);
    }
    // 切片存储
    fs.renameSync(path, newChunkPath);

    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    ctx.set('Access-Control-Allow-Headers', '*');
    ctx.body = { 
        errno: 0
    };
    
});
router.post('/upload/mergeChunk', async ctx => {
    const body = ctx.request.body;
    const {name, hash} = body;
    
    // chunk的文件夹
    const chunkDir = `${conf.chunkTemp}/${hash}`;
    // 读取文件目录
    const chunkPaths = await fse.readdir(chunkDir);
    const filePath = `${conf.staticPath}/${hash}`;
    // 轮询读取切片放到静态文件夹filePath下
    for (var i=0; i<chunkPaths.length; i++) {
        var chunkname = `${chunkDir}/${i}`;
        fs.appendFileSync(filePath, fs.readFileSync(chunkname));
        // fs.unlinkSync(chunkname);
    }
    // fs.rmdirSync(chunkDir);


    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    ctx.set('Access-Control-Allow-Headers', '*');
    ctx.body = { 
        errno: 0,
        "url": `${uploadHost}${hash}`
    };
});
// 允许直接访问静态资源  http://lixuemeng01.baijiahao.baidu.com:8100/static/b219157c3adbe05161761ee33.jpeg
app.use(koaStatic(__dirname));

// 启动 koaBody
// multipart: true 用于解析 enctype="multipart/form-data"
// formidable: 给内部插件 formidable 的配置 
app.use(koaBody({
    multipart: true,
    formidable: {
        uploadDir: conf.tempPath
    }
}))

// 使用路由
app.use(router.routes(), router.allowedMethods())

// 监听端口号, 启动服务器
app.listen(8100, () => {
    console.log(`the server is running on 8100`)
})