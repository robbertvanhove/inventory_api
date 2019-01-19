//SETUP
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const moment = require('moment');
const config = require('./config/config').get(process.env.NODE_ENV);
const mongoose = require('mongoose');
const winston = require('winston');
const cors = require('cors');
const logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: 'log.log'
        })
    ]
});
const {
    auth
} = require('./middleware/auth');

//MODELS
const {
    User
} = require('./models/user');
const {
    Product
} = require('./models/product');


//DB
mongoose.Promise = global.Promise;
mongoose.connect(config.DATABASE);


//PARSERS
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());


//USER
app.post('/users/register', auth, (req, res) => {
    if (!authorize(req, 1)) {
        return res.status(403).send('Unauthorized');
    }

    const user = new User(req.body);

    user.save((err, doc) => {
        if (err) return res.status(400).send(err);
        user.generateToken((err, user) => {
            if (err) return res.status(400).send(err);
            res.status(200).send('ok');
        });
    });
});


app.post('/users/login', (req, res) => {
    User.findOne({
        'email': req.body.email
    }, (err, user) => {
        if(err) return res.status(400).send(err);

        if (!user) return res.status(400).json({
            message: 'auth failed, email not existing'
        });

        user.comparePassword(req.body.password, function (err, isMatch) {
            if (err) throw err;
            if (!isMatch) return res.status(400).json({
                message: 'auth failed, pass not matching'
            });

            user.generateToken((err, user) => {
                if (err) res.status(400).send(err);
                res.status(200).json(user);
            });
        });
    });
});


//PRODUCT
app.post('/products', auth, (req, res) => {
    if (!authorize(req, 1)) {
        return res.status(403).send('Unauthorized');
    }

    let product = new Product(req.body);
    product.save((err, doc) => {
        if (err) return res.status(400).send(err);
        res.json(doc);
    });
});

app.patch('/products/:id', auth, (req, res)=> {
    const id = req.params.id;
    const updates = req.body;

    console.log("hee")
    
    Product.findByIdAndUpdate(id, updates, (err, product)=> {
        if(err) return res.status(400).send(err);
        res.status(200).json({updated: true});
    })

})


app.get('/products/count', (req, res)=> {
    Product.count(req.query, (err, doc)=> {
        if (err) res.status(400).send(err);
        res.status(200).json(doc);
    });
})

app.get('/products', auth, (req, res) => {
    if (!authorize(req)) {
        return res.status(403).send('Unauthorized');
    }

    getAllFiltered(req, res, Product);
});

app.get('/products/:id', auth, (req, res)=> {
    const id = req.params.id;
    Product.findById(id, (err, product)=> {
        if(err) return res.status(400).send(err);
        res.status(200).send(product);
    })
});








//auth functions
const authorize = (req, minRole = 2) => {
    const user = req.user;
    //authentication
    if (!user) {
        return false;
    }

    if (!(user.role <= minRole)) {
        return false;
    }
    return true;
}

const getAllFiltered = (req, res, Model) => {
    let totalCount;
    Model.count({}, (err, count) => {
        totalCount = count;
    }).then(() => {
        const offset = req.query.offset ? parseInt(req.query.offset) : 0;
        const limit = req.query.limit ? parseInt(req.query.limit) : totalCount;
        const order = req.query.order ? String(req.query.order) : 'asc';

        const sort = {};
        const sortBy = req.query.sortBy ? req.query.sortBy : '_id';
        sort[sortBy] = order;


        delete req.query['offset'];
        delete req.query['limit'];
        delete req.query['sortBy'];
        delete req.query['order'];

        Model.find(req.query).sort(sort)
            .skip(offset)
            .limit(limit)
            .exec((err, doc) => {
                if (err) return res.status(400).send();
                return res.status(200).send(doc);
            });
    });
}

//SERVE
app.listen(config.PORT, () => {
    logger.log('info', `Started at port ${config.PORT}`)
});