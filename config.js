/**
 * @author guoqing.dong
 * 
 * @description 配置对象
 */

//

const mailAuth = {
    // host: "smtp.163.com", 使用其他邮箱需要开通smtp服务，在邮箱设置里面
    host: "smtp.163.com",
    port: 465,
    secure: true, //开启加密协议，需要使用465端口号
    auth: {
        user: "17660644510@163.com", //注意，此处必须填写用户名邮箱地址
        // pass: "1234qwer" //客户端授权密码
        pass: "dgq12345" //客户端授权密码
    }
}
//设置电子邮箱数据
const SARC = (config) => {
    return Object.assign({},{
        from: '"蜡笔小新"17660644510@163.com', //发件人邮箱
        to: "878744510@qq.com", //收件人列表
        subject: "爱心天气", //标题
        // html: html // html 内容
    },config)
}

module.exports = {
    mailAuth,
    SARC
}
