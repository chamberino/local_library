const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
// These are the handler functions that will be used in the route handlers. 
// They are the callback functions that are called when specific routes are taken
// with a specific HTTP request verb.
var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');

var async = require('async');

// exports.index = function(req, res) {   
    
//     async.parallel({
//         book_count: function(callback) {
//             Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
//         },
//         book_instance_count: function(callback) {
//             BookInstance.countDocuments({}, callback);
//         },
//         book_instance_available_count: function(callback) {
//             BookInstance.countDocuments({status:'Available'}, callback);
//         },
//         author_count: function(callback) {
//             Author.countDocuments({}, callback);
//         },
//         genre_count: function(callback) {
//             Genre.countDocuments({}, callback);
//         }
//     }, function(err, results) {
//         res.render('index', { title: 'Local Library Home', error: err, data: results });
//     });
// };

// Goal: to use Promises asynchronously get the results of a call to the MongoDB server. 
//       Store the resulting Promise object in functions. Call Promise.all on those
//       functions. Map over the results and create object.


exports.index = function(req, res) { 
    const countBooks =  Book.countDocuments({});
    const book_instance = BookInstance.countDocuments({});
    const books_available= BookInstance.countDocuments({status:'Available'});
    const authors_amount = Author.countDocuments({});
    const genre_amount = Genre.countDocuments({});

    const promiseTemplate = (method) => {
        serverCall = new Promise((resolve, reject) => {
            if (method==null) { // No results.
                var err = new Error('Resource not found');
                err.status = 404;
                return next(err);
            // }
            // if(method) {
            // resolve(method);
            } else {
                // reject('err');
                resolve(method)
            }
        });
        return serverCall;
    }  

    const book_count = promiseTemplate(countBooks);
    const book_instance_count = promiseTemplate(book_instance);
    const book_instance_available_count = promiseTemplate(books_available);
    const author_count = promiseTemplate(authors_amount);
    const genre_count = promiseTemplate(genre_amount);
    
    async function getObject(callback) {
        let promiseArray = Promise.all([book_count, book_instance_count, book_instance_available_count, author_count, genre_count])
            .then(([book_count, book_instance_count, book_instance_available_count, author_count, genre_count])=> ({book_count, book_instance_count, book_instance_available_count, author_count, genre_count}))
            .then((val)=>{
                err = null;
                callback(val, err);
            })
            .catch((val) => {
                err = new Error('Resource not found');
                console.log(err);
                callback(val, err)
            });
        // let fulfilled = await promiseArray;

        // callback(fulfilled)
    };
    getObject((fulfilled, err)=>{
        res.render('index', { title: 'Local Library Home', error: err, data: fulfilled });
    })
};

// Display list of all Books.
exports.book_list = function(req, res, next) {

    Book.find({}, 'title author').collation({locale:'en',strength: 2}).sort({title:1})
    .populate('author')
    .exec(function (err, list_books) {
      if (err) { return next(err); }
        //Successful, so render
        res.render('book_list', { title: 'Book List', book_list: list_books });
      });
      
  };

  // Display detail page for a specific book.
exports.book_detail = function(req, res, next) {
 /*  

async.parallel runs the tasks collection of functions in parallel, without waiting until the
previous function has completed. If any of the functions pass an error to its callback,
the main callback is immediately called with the value of the error. Once the tasks 
have completed, the results are passed to the final callback as an array.

It is also possible to use an object instead of an array. Each property will be 
run as a function and the results will be passed to the final callback as an object 
instead of an array. This can be a more readable way of handling results 
from async.parallel.
 
 */
    async.parallel({
        book: function(callback) {

            Book.findById(req.params.id)
              .populate('author')
              .populate('genre')
              .exec(callback);
        },
        book_instance: function(callback) {

          BookInstance.find({ 'book': req.params.id })
          .exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.book==null) { // No results.
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('book_detail', { title: 'Title', book: results.book, book_instances: results.book_instance } );
    });

};

// Display book create form on GET.
exports.book_create_get = function(req, res) {
    // Get all authors and genres, which we can use for adding to our book
    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
    }, function(err, results) {
        if(err) { return next(err); }
        res.render('book_form', { title: 'Create Book' , authors: results.authors, genres: results.genres})
    });
};;


// Handle book create on POST.
exports.book_create_post = [

    /* 
    The next main difference with respect to the other form handling code is how we 
    sanitize the genre information. The form returns an array of Genre items 
    (while for other fields it returns a string). In order to validate the information 
    we first convert the request to an array (required for the next step).
    */

    // Convert the genre to an array
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            else
            console.log(req.body.genre)
            req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate fields
    body('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
    body('author', 'Author must not be empty.').isLength({ min: 1 }).trim(),
    body('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
    body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

    
/* 
We then use a wildcard (*) in the sanitiser to individually validate each of the 
genre array entries. The code below shows how - this translates to "sanitise every 
item below key genre".
*/
    // Sanitize fields (using wildcard).
    sanitizeBody('*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped and trimmed data.
        var book = new Book(
            { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
            });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Create Book',authors:results.authors, genres:results.genres, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Save book.
            book.save(function (err) {
                if (err) { return next(err); }
                    //successful - redirect to new book record.
                    res.redirect(book.url);
                });
        }
    }
];

// exports.book_delete_get = function(req, res) {
//     res.send('NOT IMPLEMENTED: Book delete POST');
// };

// Display book delete form on GET.
exports.book_delete_get = function(req, res, next) {
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).exec(callback)
        },
    }, function(err, results){
        if (err) { return next(err); }
        if (results.book==null) {
            res.redirect('/catalog/books');
        }
        res.render('book_delete', {title: 'Delete Book', book: results.book} );
    });
};

// Handle book delete on POST.
exports.book_delete_post = function(req, res) {
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).exec(callback)
        }, }, function(err, results){
            if (err) { return next(err); }
            if (results.book==null) {
                res.redirect('/catalog/books');
            }
            else {
                Book.findByIdAndRemove(req.body.bookid, function deleteBook(err) {
                if (err) { return next(err); }
                // Success - go to book list
                res.redirect('/catalog/books')
            })
        }
    });
};

// Display book update form on GET.
exports.book_update_get = function(req, res, next) {

    // Get book, authors and genres for form.
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
        }, function(err, results) {
            if (err) { return next(err); }
            if (results.book==null) { // No results.
                var err = new Error('Book not found');
                err.status = 404;
                return next(err);
            }
            // Success.
            // Mark our selected genres as checked.
            for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
                for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                    if (results.genres[all_g_iter]._id.toString()==results.book.genre[book_g_iter]._id.toString()) {
                        results.genres[all_g_iter].checked='true';
                    }
                }
            }
            res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book });
        });

};

// Handle book update on POST.
exports.book_update_post = [

    // Convert the genre to an array
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            else
            req.body.genre=new Array(req.body.genre);
        }
        next();
    },
   
    // Validate fields.
    body('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
    body('author', 'Author must not be empty.').isLength({ min: 1 }).trim(),
    body('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
    body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

    // Sanitize fields.
    sanitizeBody('title').escape(),
    sanitizeBody('author').escape(),
    sanitizeBody('summary').escape(),
    sanitizeBody('isbn').escape(),
    sanitizeBody('genre.*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data and old id.
        var book = new Book(
          { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
            _id:req.params.id //This is required, or a new ID will be assigned!
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Update Book',authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Update the record.
            Book.findByIdAndUpdate(req.params.id, book, {}, function (err,thebook) {
                if (err) { return next(err); }
                   // Successful - redirect to book detail page.
                   res.redirect(thebook.url);
                });
        }
    }
];





