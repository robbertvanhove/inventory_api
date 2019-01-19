const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: {
        type: String,
        require: true,
        unique: 1
    },
    purchasePrice: Number,
    salesPrice: Number,
    barcode: String,
    categorie: String,
    taxCategory: String
});


const Product = mongoose.model('Product', productSchema);

module.exports = {Product};