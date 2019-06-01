const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');

// These are the handler functions that will be used in the route handlers. 
// They are the callback functions that are called when specific routes are taken
// with a specific HTTP request verb.

// Display list of all Genres.

/* When using mongoose, documents can be retrieved using helpers. Every model 
method that accepts query conditions can be executed by means of a callback or 
the exec method. Therefore when you don't pass a callback you can build a query 
and eventually execute it. Mongoose will not execute a query until then or 
exec has been called upon it. */
exports.genre_list = function(req, res) {
    
    Genre.find()    
    .sort([['name', 'ascending']])
    .exec(function (err, list_genres) {
      if (err) { return next(err); }
      // Successful, so render
      res.render('genre_list', { title: 'Genre List', genre_list: list_genres });
    });

};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {

    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
              .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id })
              .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    });

};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next) {     
    res.render('genre_form', { title: 'Create Genre' });
};




/* The first thing to note is that instead of being a single middleware function 
(with arguments (req, res, next)) the controller specifies an array 
of middleware functions. 
The array is passed to the router function and each method is called in order. */

// Handle Genre create on POST.
exports.genre_create_post =  [
   
    // The body method specifies a set of fields in the request body to validate 
    // along with an optional error message that can be displayed if it fails the tests.
    // the trim() method eliminates any whitespace after the string
    // Validate that the name field is not empty.
    body('name', 'Genre name required').isLength({ min: 1 }).trim(),
    
    // Sanitize (escape) the name field.
    sanitizeBody('name').escape(),
  
    // Process request after validation and sanitization.
    (req, res, next) => {
  
      // Extract the validation errors from a request.
      const errors = validationResult(req);
  
      // Create a genre object with escaped and trimmed data.
      var genre = new Genre(
        { name: req.body.name }
      );
  
  
      if (!errors.isEmpty()) { //checks if errors from the extracted validationResult is empty. 
        // If false then there are obviously errors.
        // Render the form again with sanitized values/error messages.
        console.log(errors.array())
        res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
        return;
      }
      else {
        // Data from form is valid.
        // Check if Genre with same name already exists.
        Genre.findOne({ 'name': req.body.name })
          .exec( function(err, found_genre) {
             if (err) { return next(err); }
  
             if (found_genre) {
               // Genre exists, redirect to its detail page.
               res.redirect(found_genre.url);
             }
             else {
  
               genre.save(function (err) {
                 if (err) { return next(err); }
                 // Genre saved. Redirect to genre detail page.
                 res.redirect(genre.url);
               });
  
             }
  
           });
      }
    }
  ];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre delete GET');
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre delete POST');
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update GET');
};

// Handle Genre update on POST.
exports.genre_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update POST');
};