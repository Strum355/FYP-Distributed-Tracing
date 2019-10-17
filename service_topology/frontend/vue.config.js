// vue.config.js
module.exports = {
    // options...
    devServer: {
        host: '0.0.0.0',
        proxy: {
            '/api': {
                target: 'http://fyp-topology:8080',
                pathRewrite: {'^/api' : ''}
            }
        },
        disableHostCheck: true
    }
}