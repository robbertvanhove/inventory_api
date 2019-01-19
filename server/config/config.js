const config = {
    production: {
        SECRET: process.env.SECRET,
        DATABASE: process.env.MONGODB_URI,
        PORT: process.env.PORT,
    },
    default: {
        SECRET: 'kjhjksdf',
        DATABASE: 'mongodb://robbert:Keeper18@ds113003.mlab.com:13003/mysite',
        PORT: 3000
    }
}

exports.get = function get(env){
    return config[env] || config.default;
}