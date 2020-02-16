const request = require('superagent');
const cheerio = require('cheerio');
const template = require('art-template');
const path = require('path');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const moment = require('moment');

moment.locale('zh-CN')


function getDayData() {
    return new Promise((resolve, reject) => {
        //now date
        const today = moment()
        //meet date
        const meet = moment('2020-02-10')
        //days
        const count = today.diff(meet, 'day')
        //format
        const format = moment().format("dddd, MMMM Do YYYY, h:mm:ss a")
        resolve({
            count,
            format
        })
    })
}


//请求墨迹天气

function getMojiData() {
    return new Promise((resolve, reject) => {
        request.get('https://tianqi.moji.com/weather/china/shandong/the-marshes-of-mount-liang-scenic-spots').end((err, res) => {
            if (err) return console.error('请求数据失败')

            // console.log(res.text)
            // 把字符串解析成HTML, 并可用jQuery核心选择器获取内容
            const $ = cheerio.load(res.text);

            // 图标
            const icon = $('.wea_weather span img').attr('src');
            // 天气
            const weather = $('.wea_weather b').text();
            // 温度
            const temperature = $('.wea_weather em').text();
            // 提示
            const tips = $('.wea_tips em').text()

            resolve({
                icon,
                weather,
                temperature,
                tips
            })
        })
    })
}

//请求ONE
function getOneData() {
    return new Promise((resolve, reject) => {
        request.get('http://wufazhuce.com/').end((err, res) => {
            if (err) return console.error('请求数据失败');
            //把返回值中的页面解析成 HTML
            const $ = cheerio.load(res.text)
            // 抓取 one 的图片
            const img = $('.carousel-inner>.item>img, .carousel-inner>.item>a>img').eq(0).attr('src')
            // 抓取 one 的文本
            const text = $('.fp-one .fp-one-cita-wrapper .fp-one-cita a').eq(0).text();

            resolve({
                img,
                text
            });
        })
    })
}
// 4.0 通过模板引擎替换HTML的数据

async function renderTemplate() {
    const [dayData, mojiData, oneData] = await Promise.all([getDayData(), getMojiData(), getOneData()])

    // 所有数据都获取成功的时候，才进行模板引擎数据的替换
    return new Promise((resolve, reject) => {
        const html = template(path.join(__dirname, './index.html'), {
            dayData,
            mojiData,
            oneData
        });
        resolve(html);
    })
}
renderTemplate()

//发送邮件

async function sendMail() {
    // HTML 页面内容,通过 await 等等模板引擎渲染完毕后，再往下执行代码
    const html = await renderTemplate();

    // 使用默认SMTP传输，创建可重用邮箱对象
    let transporter = nodemailer.createTransport({
        // host: "smtp.163.com", 使用其他邮箱需要开通smtp服务，在邮箱设置里面
        host: "smtp.163.com",
        port: 465,
        secure: true, //开启加密协议，需要使用465端口号
        auth: {
            user: "17660644510@163.com", //注意，此处必须填写用户名邮箱地址
            // pass: "1234qwer" //客户端授权密码
            pass: "dgq12345" //客户端授权密码
        }
    });

    //设置电子邮箱数据
    let mailOptions = {
        from: '"蜡笔小新"17660644510@163.com', //发件人邮箱
        to: "878744510@qq.com", //收件人列表
        subject: "爱心天气", //标题
        html: html // html 内容
    };

    transporter.sendMail(mailOptions, (error, info = {}) => {
        if (error) {
            console.log(error);
            sendMail(); //再次发送
        }
        console.log("邮件发送成功", info.messageId);
        console.log("静静等下一次发送");
    })
}
sendMail();
// 6. 定时每天23时36分发送邮件给女（男）朋友

// 6.1 创建定时任务
var j;

function createSchedule() {
    j = schedule.scheduleJob('7 7 7 * * *', function () {
        sendMail();
        // console.log('The answer to life, the universe, and everything1');
        console.log("定时任务的邮件发送成功");
    })
}

// createSchedule()