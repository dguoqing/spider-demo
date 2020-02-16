const request = require('superagent');
const cheerio = require('cheerio');
const template = require('art-template');
const path = require('path');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const moment = require('moment');

moment.locale('zh-CN')

const {
    mailAuth,
    SARC
} = require('./config.js')


class Spider {
    constructor() {
        // 使用默认SMTP传输，创建可重用邮箱对象
        this.transporter = nodemailer.createTransport(mailAuth);
    }
    //获取天数
    getDayData() {
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
    static splider(url) {
        return new Promise((resolve, reject) => {
            request.get(url).end((err, res) => {
                if (err) return console.error('请求数据失败')
                resolve(res.text)
            })
        })
    }
    //请求墨迹天气
    getMojiData() {
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
    getOneData() {
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

    async renderTemplate() {
        const {
            getDayData,
            getMojiData,
            getOneData
        } = this
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
    async sendMail() {
        // HTML 页面内容,通过 await 等等模板引擎渲染完毕后，再往下执行代码
        const html = await this.renderTemplate();



        this.transporter.sendMail(SARC({
            html
        }), (error, info = {}) => {
            if (error) {
                console.log(error);
                this.sendMail(); //再次发送
            }
            console.log("邮件发送成功", info.messageId);
            console.log("静静等下一次发送");
        })
    }

    // 6. 定时每天23时36分发送邮件给女（男）朋友
    createSchedule() {
        console.log('定时任务开始...')
        this.j = schedule.scheduleJob('7 7 7 * * *', function () {
            this.sendMail();
            // console.log('The answer to life, the universe, and everything1');
            console.log("定时任务的邮件发送成功");
        })
    }
}

const spider = new Spider()
spider.createSchedule()