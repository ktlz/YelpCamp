let express = require("express");
let router = express.Router();
let passport = require("passport");
let User = require("../models/user");
let Campground = require("../models/campground");
const { checkProfileOwnership } = require("../middleware");


//root route
router.get('/', function(req, res){
    res.render('landing');
});


//Show register form
router.get("/register", function(req, res){
    res.render("register", {page: 'register'});
});

//handling sign up logic
router.post("/register", function(req, res){
    let newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar
    });
    if(req.body.adminCode === 'admincode'){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to YelpCamp " + user.username);
            res.redirect("/campgrounds");
        });
    });
});

// show login form
router.get("/login", function(req, res){
    res.render("login", {page: 'login'});
});

//handling login logic
router.post("/login", passport.authenticate("local", 
{
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}), function(req, res){
});

//logout 
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});

//USER PROFILE
router.get("/users/:id", function(req, res){
    User.findById(req.params.id, function(err, foundUser){
        if(err) {
            req.flash("error", "Somthing went wrong");
            res.redirect("back");
        }
        Campground.find().where("author.id").equals(foundUser._id).exec(function(err, campgrounds){
            if(err) {
                req.flash("error", "Somthing went wrong");
                res.redirect("back");
            }
            res.render("users/show", {user: foundUser, campgrounds: campgrounds});
        });
    });
});

//EDIT user profile route
router.get("/users/:id/edit", checkProfileOwnership, function(req, res){
    User.findById(req.params.id, function(err, foundUser){
        res.render("users/edit", {user: foundUser});
    });
});

//UPDATE user profile route
router.put("/users/:id", checkProfileOwnership, function(req, res){
    User.findByIdAndUpdate(req.params.id, req.body.user, function(err, foundUser){
        if(err) {
            res.redirect("back");
        } else {
            res.redirect("/users/" + req.params.id);
        }
    })
})

// //DELETE user's profile
// router.delete("/users/:id", middleware.checkProfileOwnership, function(req, res){
//     User.findByIdAndRemove(req.params.user_id, function(err){
//         if(err){
//             res.redirect("back");
//         } else {
//             req.flash("success", "User deleted");
//             res.redirect("/campgrounds");
//         }
//     });
// });


module.exports = router;