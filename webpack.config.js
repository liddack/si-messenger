const path = require('path');

module.exports = {
    entry: './src/app.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'cordova/www')
    },
    module: {
        rules: [{
            test: /\.css$/,
            use: ['style-loader', {
                loader: 'css-loader',
                options: {
                    minimize: true
                }
            }],    
        }]
    }
};