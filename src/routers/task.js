const express = require('express');
const router = new express.Router();
const Task = require('../models/task.js'); // Implementing model
const authMiddleware = require('../middleware/auth'); // Middleware

// Using Promises task apis
// Create new task
// router.post('/tasks', (req, res) => {
//     const task = new Task(req.body);

//     task.save().then(() => {
//         res.send(task);
//     }).catch((e) => {
//         res.status(400).send(e);
//     });
// });

// // Fetch all tasks
// router.get('/tasks', (req, res) => {
//     Task.find().then((tasks) => {
//         res.send(tasks);
//     }).catch((e) => {
//         res.status(400).send(e);
//     });
// });

// // Fetch task by id
// router.get('/tasks/:id', (req, res) => {
//     const _id = req.params.id;
//     Task.findById(_id).then((task) => {
//         if(!task) {
//             return res.status(404).send();
//         }
//         res.send(task);
//     }).catch((e) => {
//         res.status(400).send(e);
//     })
// });

// Using async and await task apis
// Create new task
router.post('/tasks', authMiddleware, async (req, res) => {
    // const task = new Task(req.body);
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try {
        await task.save();
        res.send(task); 
    } catch (e) {
        res.status(400).send(e);
    }
});

// Fetch all tasks (All tasks of all user)
router.get('/tasks/all', authMiddleware, async (req, res) => {
    try {
        const tasks = await Task.find().populate('owner'); // To get owner whole info instead of just a id
        // Also need to made some changes in task schema to owner to relate or reference
        res.send(tasks);    
    } catch (e) {
        res.status(400).send(e);   
    }
});

// Fetch filtered all tasks of all user on the basis of completed status
// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', authMiddleware, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    // with find
    // Model.find({'completed: true}).sort('createdAt', 1).skip(2).limit(5) 

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch (e) {
        res.status(500).send()
    }
})

// Fetch all tasks (All tasks of a specific user)
router.get('/tasks', authMiddleware, async (req, res) => {
    try {
        /** Two ways to do this, fetching user specific task only from all tasks */
        // First way
        // const tasks = await Task.find({ owner: req.user._id});
        // res.send(tasks);
        // Second way for this we have to create a virtual in User model
        await req.user.populate('tasks').execPopulate(); // Here tasks is passed into virtual name
        console.log(req.user.tasks);
        res.send(req.user.tasks);
        //    
    } catch (e) {
        res.status(400).send(e);   
    }
});

// Fetch task by id
router.get('/tasks/:id', authMiddleware, async (req, res) => {
    const _id = req.params.id;
    try {
        // const task = await Task.findById(_id);
        const task = await Task.findOne({_id, owner: req.user._id});
        if(!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Update task by id
router.patch('/tasks/:id', authMiddleware, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        // Anyone can update
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        // Only user which has created can update
        const task = await Task.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, req.body, { new: true, runValidators: true });
        if (!task) {
            return res.status(404).send();
        }

        res.send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Delete user by id
router.delete('/tasks/:id', authMiddleware, async (req, res) => {
    try {
        // const task = await Task.findByIdAndDelete(req.params.id); // Anyone can delete
        
        // Only user which has created can delete
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
        
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

module.exports = router;