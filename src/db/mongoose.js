const mongoose = require('mongoose');
const validator = require('validator');

// To connect to database
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true
});
// 1 - connection url consist of mongodb url + db name
// 2 - Options and useNewUrlParser is must to include 