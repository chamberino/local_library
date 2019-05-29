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
    res.send('NOT IMPLEMENTED: Book create GET');
};

// Handle book create on POST.
exports.book_create_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Book create POST');
};

// Display book delete form on GET.
exports.book_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Book delete GET');
};

// Handle book delete on POST.
exports.book_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Book delete POST');
};

// Display book update form on GET.
exports.book_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Book update GET');
};

// Handle book update on POST.
exports.book_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Book update POST');
};










 /*
    
    book_count = new Promise((resolve, reject) => {
        if(Book.countDocuments({})) {
        resolve(Book.countDocuments({}));
        } else {
            reject(err);
        }
    });

    book_instance_count = new Promise((resolve, reject) => {
        if(BookInstance.countDocuments({})) {
        resolve(BookInstance.countDocuments({}));
        } else {
            reject(err);
        }
    });


    book_instance_available_count = new Promise((resolve, reject) => {
        if(BookInstance.countDocuments({})) {
            resolve(BookInstance.countDocuments({status:'Available'}));
        } else {
            reject('err');
        }
    });

    author_count = new Promise((resolve, reject) => {
        if(Author.countDocuments({})) {
            resolve(Author.countDocuments({}));
        } else {
            reject('err');
        }
    });

 

    genre_count = new Promise((resolve, reject) => {
        if(Genre.countDocuments({})) {
            resolve(Genre.countDocuments({}));
        } else {
            reject('err');
        }
    });
 */