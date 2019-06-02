const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
var Author = require('../models/author');
var async = require('async');
var Book = require('../models/book');

// These are the handler functions that will be used in the route handlers. 
// They are the callback functions that are called when specific routes are taken
// with a specific HTTP request verb.

// Display list of all Authors.
exports.author_list = function(req, res, next) {

    Author.find()
      .sort([['family_name', 'ascending']])
      .exec(function (err, list_authors) {
        if (err) { return next(err); }
        //Successful, so render
        res.render('author_list', { title: 'Author List', author_list: list_authors });
      });
  
  };

// Display detail page for a specific Author.
exports.author_detail = function(req, res, next) {

    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id)
              .exec(callback)
        },
        authors_books: function(callback) {
          Book.find({ 'author': req.params.id },'title summary')
          .exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); } // Error in API usage.
        if (results.author==null) { // No results.
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('author_detail', { title: 'Author Detail', author: results.author, author_books: results.authors_books } );
    });

};

// Display Author create form on GET
exports.author_create_get = (req, res) => {
    //Display Author form on GET
    res.render('author_form', {title: 'Create Author'});
};

// Handle Author create on POST
exports.author_create_post = [

    //Validate fields
    /* We can daisy chain validators, using withMessage() to specify the error message
    to display if the previous validation method fails. This makes it very easy to 
    provide specific error messages without lots of code duplication. */
    body('first_name').isLength({min: 1}).trim().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').isLength({min: 1}).trim().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'), 
    /* We can use the optional() function to run a subsequent validation only if a field 
    has been entered (this allows us to validate optional fields). 
    For example, below we check that the optional date of birth is an ISO8601-compliant
    date (the checkFalsy flag means that we'll accept either an empty string or null as an empty value). */   
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(),               

    // Sanitize fields.
    sanitizeBody('first_name').escape(),
    sanitizeBody('family_name').escape(),
    /* Parameters are recieved from the request as strings. We can use toDate() 
    (or toBoolean(), etc.) to cast these to the proper JavaScript types. */
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render('author_form', { title: 'Create Author', author: req.body, errors: errors.array() });
            return;
        } else {
            console.log(req.body);
            // Data from form is valid.

            // Create an Author object with escaped and trimmed data.
            var author = new Author(
                {
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death
                });
            author.save(function(err) {
                if (err) {return next(err)}
                // Successful - redirect to new author record.
                res.redirect(author.url);
            });    
        }
    }
];

// Display Author delete form on GET.
exports.author_delete_get = function(req, res, next) {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback)
        },
        authors_books: function(callback) {
          Book.find({ 'author': req.params.id }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        /* If  findById() returns no results the author is not in the database. 
        In this case there is nothing to delete, so we immediately render the 
        list of all authors.  */
        if (results.author==null) { // No results.
            res.redirect('/catalog/authors');
        }
        // Successful, so render.
        console.log(results.author);
        res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books } );
    });
};

// Handle Author delete on POST.
exports.author_delete_post = function(req, res, next) {

    async.parallel({
        author: function(callback) {
          Author.findById(req.body.authorid).exec(callback)
        },
        authors_books: function(callback) {
          Book.find({ 'author': req.body.authorid }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.authors_books.length > 0) {
            // Author has books. Render in same way as for GET route.
            res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books } );
            return;
        }
        else {
            // Author has no books. Delete object and redirect to the list of authors.
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                if (err) { return next(err); }
                // Success - go to author list
                res.redirect('/catalog/authors')
            })
        }
    });
};

// Handle Author update form on GET
exports.author_update_get = function(req, res) {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id)
              .exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); } // Error in API usage.
        if (results.author==null) { // No results.
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        console.log(results.author.date_of_birth)
        res.render('author_form', { title: 'Author Update', author: results.author } );
    });
};

// Handle Author update form on POST
exports.author_update_post = [

    //Validate fields
    /* We can daisy chain validators, using withMessage() to specify the error message
    to display if the previous validation method fails. This makes it very easy to 
    provide specific error messages without lots of code duplication. */
    body('first_name').isLength({min: 1}).trim().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').isLength({min: 1}).trim().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'), 
    /* We can use the optional() function to run a subsequent validation only if a field 
    has been entered (this allows us to validate optional fields). 
    For example, below we check that the optional date of birth is an ISO8601-compliant
    date (the checkFalsy flag means that we'll accept either an empty string or null as an empty value). */   
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(),               

    // Sanitize fields.
    sanitizeBody('first_name').escape(),
    sanitizeBody('family_name').escape(),
    /* Parameters are recieved from the request as strings. We can use toDate() 
    (or toBoolean(), etc.) to cast these to the proper JavaScript types. */
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        const errors = validationResult(req);

        // Create an Author object with escaped and trimmed data.
        var author = new Author(
            {
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death,
                _id:req.params.id //This is required, or a new ID will be assigned!
            });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            async.parallel({
                author: function(callback) {
                    Author.findById(req.params.id)
                      .exec(callback)
                },
            }, function(err, results) {
                if (err) { return next(err); } // Error in API usage.
                if (results.author==null) { // No results.
                    var err = new Error('Author not found');
                    err.status = 404;
                    return next(err);
                }
                // Successful, so render.
                console.log(results.author.date_of_birth)
                res.render('author_form', { title: 'Author Update', author: results.author } );
            });    
            return;
        } else {
            // Data from form is valid.
            Author.findByIdAndUpdate(req.params.id, author, {}, function (err,theauthor) {
                if (err) {return next(err)}
                console.log(theauthor)
                // Successful - redirect to new author record.
                res.redirect(theauthor.url);
            });    
        }
    }
];

/* The module first requires the model that we'll later 
by using to access and update our data. It then exports 
functions for each of the URLs we wish to handle (the create, 
update and delete operations use forms, and hence also have additional 
methods for handling form post requests — we'll discuss those methods
in the "forms article" later on). */

/* All the functions have the standard form of an Express middleware 
function, with arguments for the request and response. We could also
include the next function to be called if the method does not complete 
the request cycle, but in all these cases it does, so we've omitted it.. 
The methods simply return a string indicating that the associated page 
has not yet been created. If a controller function is expected to 
receive path parameters, these are output in the message string 
(see req.params.id above). */