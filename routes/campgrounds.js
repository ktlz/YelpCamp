let express = require("express");
let router = express.Router();
let Campground = require("../models/campground");
let middleware = require("../middleware");

var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: 'AIzaSyAtAZMMgJrkdEKNHdzDoAY6xS0s3ova3KE',
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

//INDEX - show all campgrounds
router.get('/', function(req, res){
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');        //Get all campgrounds from DB
        Campground.find({name: regex}, function(err, campgrounds){
            if(err) {
                console.log(err);
            } else {
                let noMatch;
                if(campgrounds.length < 1){
                    noMatch = "No campgrounds match that query, please try again.";
                }
                res.render('campgrounds/index', {campgrounds: campgrounds, noMatch: noMatch, currentUser: req.user, page: campgrounds});
            }
        });
    } else {
        //Get all campgrounds from DB
        Campground.find({}, function(err, campgrounds){
            if(err) {
                console.log(err);
            } else {
                res.render('campgrounds/index', {campgrounds: campgrounds,  noMatch: undefined, currentUser: req.user, page: campgrounds});
            }
        });
    }
});

//CREATE route - add new campground to DB
router.post('/', middleware.isLoggedIn, function(req, res){
    let name = req.body.name;
    let price = req.body.price;
    let image = req.body.image;
    let description = req.body.description;
    let author = {
        id: req.user._id,
        username: req.user.username
    }
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
          req.flash('error', 'Invalid address');
          return res.redirect('back');
        }
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
    let newCampground = {name: name, image: image, description: description, author: author, price: price, lat: lat, lng: lng, location: location};
    //create a new campground
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            res.redirect('/campgrounds');
        }
    });
    }); 
});


//NEW - show form to create new campground
router.get('/new', middleware.isLoggedIn, function(req, res){
    res.render('campgrounds/new');
});

//SHOW
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground) {
            req.flash("error", "Campground not found");
            req.redirect("back");
        } else {
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
    
});

//EDIT CAMPGROUND ROUTE 
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
    geocoder.geocode(req.body.location, function (err, data) {
      if (err || !data.length) {
        req.flash('error', 'Invalid address');
        console.log(err.message);
        return res.redirect('back');
      }
      req.body.campground.lat = data[0].latitude;
      req.body.campground.lng = data[0].longitude;
      req.body.campground.location = data[0].formattedAddress;
  
      Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
          if(err){
              req.flash("error", err.message);
              res.redirect("back");
          } else {
              req.flash("success","Successfully Updated!");
              res.redirect("/campgrounds/" + campground._id);
          }
      });
    });
  });

//DESTROY ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
   Campground.findByIdAndRemove(req.params.id, function(err){
       if(err){
           res.redirect("/campgrounds");
       } else {
           res.redirect("/campgrounds");
       }
   });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;