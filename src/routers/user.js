const express = require('express');
const router = new express.Router();
const multer = require('multer');
const User = require('../models/user.js'); // Including model
const mail = require('../utils/emails/mail');
const authMiddleware = require('../middleware/auth'); // Middleware

// Create new user
// router.post('/users', (req, res) => {
//     const user = new User(req.body);
//     user.save().then(() => {
//         res.send(user);
//     }).catch((e) => {
//         res.status(400).send(e);
//     });
// });

// Create new user with async and await
router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save();
        // For email
        mail.sendWelcomeEmail(user.email, user.name);
        // For token
        const token = await user.getAuthToken();
        //
        res.send({user, token});   
    } catch (e) {
        res.status(400).send(e);
    }
});

// Fetch all users
router.get('/users', authMiddleware, async (req, res) => {
    try {
        const users = await User.find();
        res.send(users);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Fetch user by id
router.get('/users/:id', authMiddleware, async (req, res) => {
    const _id = req.params.id;

    try {
        const user = await User.findById(_id);
        if(!user) {
            return res.status(404).send();
        }
        res.send(user);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Update user by id
router.patch('/users/:id', authMiddleware, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        // findByIdAndUpdate bypass mongoose middleware
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        const user = await User.findById(req.params.id);

        updates.forEach((value) => {
            user[value] = req.body[value];
        });

        await user.save();
        if (!user) {
            return res.status(404).send();
        }

        res.send(user);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Delete user by id
router.delete('/users/:id', authMiddleware, async (req, res) => {
    try {
        // const user = await User.findByIdAndDelete(req.params.id);
        // To add middleware on remove to delete all tasks related to a user
        const user = await User.findById(req.params.id);
        await user.remove();

        if (!user) {
            return res.status(404).send();
        }
        mail.sendCancelationEmail(user.email, user.name);
        res.send(user);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Fetch user profile
router.post('/users/profile', authMiddleware, async (req, res) => {
    res.send(req.user);
});


/**
 * 
 * Upload Profile picture
 * 
 */

//Setting destination to upload files
const upload = multer({
    // dest: 'images/user',
    limits: {
        fileSize: 10000000 // 10 MB // In bytes
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload only jpg|jpeg|png.'));
        }
        cb(undefined, true); // Accepted the file


        // cb(new Error('Pdf are allowed only')); // Send Error message
        // cb(undefined, true); // Accepted the file
        // cb(undefined, false); // Rejected the file
    }
})

// Upload profile picture
// Second argument upload.single('avatarKey') in which avatarKey is key value combination send from client end
router.post('/users/profile/avatar', authMiddleware, upload.single('avatarKey'), async (req, res) => {
    req.user.avatar = req.file.buffer;
    await req.user.save();
    res.send('Uploaded');
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
});

// Remove uploaded profile picture
// Second argument upload.single('avatarKey') in which avatarKey is key value combination send from client end
router.delete('/users/profile/avatar', authMiddleware, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send('Deleted');
});

// Login user
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        // Here findByCredentials is a Model function which is not predefined function of mongoose and it is created by us in user model file
        const token = await user.getAuthToken();
        // Here getAuthToken is instance method which is not predefined and is created by us in user model to get JWT token 
        res.send({ user, token });
    } catch (e) {
        res.status(400).send();
    }
});

// Fetch user logout
router.post('/users/logout', authMiddleware, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send(error);
    };
});

// Fetch user logout all sessions
router.post('/users/logoutAll', authMiddleware, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send(error);
    };
});

// To get profile picture
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/*');
        res.send(user.avatar);
    } catch (e) {
        res.status(404).send();
    }
})

module.exports = router;