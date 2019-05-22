const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = new mongoose.Schema({ 
    name: {
        type: String,
        required: true,
        trim: true   
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error('Email address is not valid.');
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be positive number.');
            }
        }
    }, 
    password: {
        type: String,
        required: true,
        trim: true,
        min: 7,
        max: 20,
        validate(value) {
            if(value.toLowerCase().includes('password')) {
                throw new Error('Password can not contain "password".');
            }
        }
    },
    avatar: {
        type: Buffer
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }] 
}, {
    timestamps: true // To get created at and updated at
});

// Virtual for db relationship between collections
userSchema.virtual('tasks', {
    ref: 'Task', // Collection to relate
    localField: '_id',
    foreignField: 'owner' // Field in task model containing user id which has created the task
})

// Middleware
// To hash password before saving a user into database
userSchema.pre('save', async function(next) { // we cant use arrow function with middleware
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8) // Here 8 is no of rounds
    }
    next();
});

// To get all the tasks of a user after deleting the user
userSchema.pre('remove', async function (next) {
    const user = this;
    await Task.deleteMany({ owner: user._id });
    next();
})

// Method or instance method are applied to or accessible on User instances 
// To get jwt token for user
userSchema.methods.getAuthToken = async function() { // Dont use arrow function
    const user = this;
    const token = await jwt.sign({ _id : user._id.toString() }, process.env.JWT_SECRET); // Here second argument is custom string
    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
}

// To remove password and tokens from user data before sending reaponse to client
userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
}

// Statics funcyions are model function which are applied to or accessible on User model 
// Creating our own function to verify to user Credentials
userSchema.statics.findByCredentials = async (email ,password) => {
    const user = await User.findOne({ email: email });
    if(!user){
        throw new Error('Unable to login');   
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
        throw new Error('Unable to login');
    }
    return user;
}

const User = mongoose.model('User', userSchema);

module.exports = User;