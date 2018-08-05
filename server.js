const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const cors = require('cors');

const mongoose = require('mongoose');
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' );

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

var Schema = mongoose.Schema;

var exerciseSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date
});

var Exercise = mongoose.model('Exercise', exerciseSchema);


app.post("/api/exercise/new-user", function(req,res) {
  var newUser = new Exercise({ username: req.body.username });  
  
  Exercise.find({ username: req.body.username }, function(error, data) {
    if (data.length) {
      res.send("User exists -- ID is " + JSON.stringify(data[0]._id));
    } else {
      newUser.save(function(error,user) {
        if (error) return console.error(error);
        res.json({ userId: user._id });
      });
    }
  });
});

app.post("/api/exercise/add", function(req,res) {
  var username;
  
  Exercise.findById(req.body.userId, function(error, data) {
    if (error) return console.error(error);
    username = JSON.stringify(data.username);
  });
  
  var newExercise = new Exercise({ 
      username: username, 
      description: req.body.description, 
      duration: req.body.duration, 
      date: req.body.date 
    }, 
    function(error, data) {
      if (error) return console.error(error);
      res.send("Successfully created exercise");
    });
  
  newExercise.save(function(error,user) {
    if (error) return console.error(error);
    res.send("Succesfully created exercise");
  });
});

// test to show all information for user, useful for testing
app.get("/api/exercise/user/:user", function(req,res) {
  Exercise.findOne({ username: req.params.user }, function(error, data) {
    if (error) return console.error(error);
    res.json(data);
  });
});

app.get("/api/exercise/log", function(req,res) {
  
  var username;
  
  Exercise.findById(req.query.userId, function(error, data) {
    if (error) return console.error(error);
    username = JSON.stringify(data.username);
  });
  
  var findUser = Exercise.find({ username: username });
  
  if (req.query.from) {
    findUser.where('date').gte(req.query.from);
  }
  
  if (req.query.to) {
    findUser.where('date').lte(req.query.to);
  }
  
  if (req.query.limit) {
   findUser.limit(Number(req.query.limit));
  }
  
  findUser.exec(function(error, data) {
    if (error) return console.error(error);
    res.json(data);
  });
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
