// Require mongoose 
// const mongoose = require('mongoose');

// Define a schema
const Schema = mongoose.Schema;

var someModelSchema = new Schema({
    a_string: String,
    a_date: Date
});

// Compile model from schema
var SomeModel = mongoose.model('SomeModel' ,someModelSchema);

// Create an instance of model SomeModel
var awesome_instance = new SomeModel({ name: 'awesome' });

// Save the new model instance, passing a callback
awesome_instance.save(function(err) {
    if (err) return handleError(err);
    // saved!
})

// You can also use create() to define the model instance at
// the same time you save it. The callback will return an error for
// the first argument and the newly-created model instance for
// the second argument.
SomeModel.create({name: 'also_awesome'}, (err, awesome_instance) => {
    if (err) return handleError(err);
})

// Access model field values using dot notation
console.log(awesome_instance.name);

// Chance record by modifying the fields, then calling save
awesome_instance.name="New cool name";
awesome_instance.save(function (err) {
   if (err) return handleError(err); // saved!
});

// Searching for records
// You can search for records using query methods, specifying the 
// query conditions as a JSON document. The code fragment below 
// shows how you might find all athletes in a database that play 
// tennis, returning just the fields for athlete name and age. 
// Here we just specify one matching field (sport) but you can 
// add more criteria, specify regular expression criteria, or 
// remove the conditions altogether to return all athletes.

var Athlete = mongoose.model('Athlete', yourSchema);

// find all athletes who play tennis, 
// selecting the 'name' and 'age' fields
Athlete.find({ 'sport': 'Tennis'}, 'name age', (err, athletes) => {
    if (err) return handleError(err);
    // 'athletes' contains the list of athletes that match the criteria
})

// If you don't specify a callback then the API will return a 
// variable of type Query. You can use this query object to build up 
// your query and then execute it (with a callback) later 
// using the exec() method.

// find all athletes that play tennis
var query = Athlete.find({ 'sport': 'Tennis' });

// selecting the 'name' and 'age' fields
query.select('name age');

// limit our results to 5 items
query.limit(5);

// sort by age
query.sort({ age: -1 });

// execute the query at a later time
query.exec(function (err, athletes) {
  if (err) return handleError(err);
  // athletes contains an ordered list of 5 athletes who play Tennis
})

// Above we've defined the query conditions in the find() method. We can also 
// do this using a where() function, and we can chain all the parts of our 
// query together using the dot operator (.) rather than adding them separately. 
// The code fragment below is the same as our query above, 
// with an additional condition for the age.

Athlete.
  find().
  where('sport').equals('Tennis').
  where('age').gt(17).lt(50).  //Additional where query
  limit(5).
  sort({ age: -1 }).
  select('name age').
  exec(callback); // where callback is the name of our callback function.

  // Working with related document - population

  // https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose

var mongoose = require('mongoose')
  , Schema = mongoose.Schema

var authorSchema = Schema({
  name    : String,
  stories : [{ type: Schema.Types.ObjectId, ref: 'Story' }]
});

var storySchema = Schema({
  author : { type: Schema.Types.ObjectId, ref: 'Author' },
  title    : String
});

var Story  = mongoose.model('Story', storySchema);
var Author = mongoose.model('Author', authorSchema);

// We can save our references to the related document by assigning the 
// _id value. Below we create an author, then a story, and assign 
// the author id to our story's author field.

var bob = new Author({ name: 'Bob Smith' });

bob.save(function (err) {
  if (err) return handleError(err);

  //Bob now exists, so lets create a story
  var story = new Story({
    title: "Bob goes sledding",
    author: bob._id    // assign the _id from the our author Bob. This ID is created by default!
  });

  story.save(function (err) {
    if (err) return handleError(err);
    // Bob now has his story
  });
});

// Our story document now has an author referenced by the author document's ID. 
// In order to get the author information in the story results we use populate(), 
// as shown below.

Story
.findOne({ title: 'Bob goes sledding' })
.populate('author') //This populates the author id with actual author information!
.exec(function (err, story) {
  if (err) return handleError(err);
  console.log('The author is %s', story.author.name);
  // prints "The author is Bob Smith"
});


// One schema/model per file
// While you can create schemas and models using any file structure you like, 
// we highly recommend defining each model schema in its own module (file), 
// exporting the method to create the model. This is shown below:

// File: ./models/somemodel.js

//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var SomeModelSchema = new Schema({
  a_string          : String,
  a_date            : Date,
});

//Export function to create "SomeModel" model class
module.exports = mongoose.model('SomeModel', SomeModelSchema );

// You can then require and use the model immediately in other files. 
// Below we show how you might use it to get all instances of the model.

//Create a SomeModel model just by requiring the module
var SomeModel = require('../models/somemodel')

// Use the SomeModel object (model) to find all SomeModel records
SomeModel.find(callback_function);