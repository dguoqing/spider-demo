const http = require('http')



http.get('http://www.moji.com/',res => {
    let html = '';
    res.on('data',data => {
        html += data
    })
    res.on('end', () => {
        console.log(html)
    })
})