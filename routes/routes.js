const express = require("express");
const router = express.Router();
const User = require('../models/users');
const multer = require('multer');
const users = require("../models/users");
const mongoose = require('mongoose'); 
const fs = require('fs').promises;

//image upload
var storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './uploads');
    }, 
    filename: function(req, file, cb){
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
});

var upload = multer({
    storage: storage,
}).single("image");

//Insert an user into database route
router.post('/add', upload, (req, res)=>{
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: req.file.filename,
    });
    console.log(user);

    user.save()
    .then(() => {
        req.session.message = {
            type: 'success',
            message: 'User added successfully!'
        };
        res.redirect('/');
    })
    .catch(err => {
        res.json({ message: err.message, type: 'danger' });
    });
});

//Get all users route

router.get("/", (req, res) => {
    User.find().exec()
        .then(users => {
            res.render('index', {
                title: 'Home Page',
                users: users
            });
        })
        .catch(err => {
            res.json({ message: err.message });
        });
});

router.get("/add", (req, res) =>{
    res.render("add_users", {title: "Add Users"});
});

//Edit an user route
router.get('/edit/:id', (req, res) => {
    let id = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.redirect('/');
    }
    User.findById(id)
        .then(user => {
            if (!user) {
                throw new Error("User not found");
            }
            res.render("edit_users", {
                title: "Edit User",
                user: user,
            });
        })
        .catch(err => {
            console.error(err);
            res.redirect("/");
        });
});

//Update user router

router.post('/update/:id', upload, async (req, res) => {
    let id = req.params.id;
    let new_image = "";

    if (req.file) {
        new_image = req.file.filename;
        try {
            await fs.unlink("./uploads/" + req.body.old_image);
        } catch (err) {
            console.log(err);
        }
    } else {
        new_image = req.body.old_image;
    }

    try {
        await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: new_image,
        });

        req.session.message = {
            type: 'success',
            message: 'User updated successfully!'
        };
        res.redirect("/");

    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
});

//Delete user route
router.get('/delete/:id', async (req, res) => {
    let id = req.params.id;

    try {
        const user = await User.findByIdAndRemove(id);

        if (user && user.image != '') {
            try {
                await fs.unlink('./uploads/' + user.image);
            } catch (err) {
                console.log(err);
            }
        }

        req.session.message = {
            type: 'info',
            message: 'User deleted successfully!'
        };
        res.redirect('/');

    } catch (err) {
        console.error(err);
        res.json({ message: err.message });
    }
});

module.exports = router;