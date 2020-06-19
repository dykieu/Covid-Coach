const express = require('express');
const mongoose = require('mongoose');
const compression = require('compression');
const helmet = require('helmet');
const session = require('express-session');
const mongodb = require('mongodb');
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser');
const app = express();

app.use(helmet());
app.use(compression());

app.set('port', (process.env.PORT || 8080));

// mongodb connection
const mongoUrl = `Mongodb connection url here`;
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
  dbName: `Database name here`
})
  .then(() => {
    console.log('Connection to the Atlas Cluster is successful!');
  })
  .catch((err) => console.error(err));
const db = mongoose.connection;

// errors with database connection, logs to console.
db.on('error', console.error.bind(console, 'connection error:'));

// use sessions for tracking logins
app.use(session({
  secret: `dbName here`,
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  })
}));

// make user ID available in templates
app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId;
  next();
});

// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// serve static files from /public
app.use(express.static(__dirname + '/public'));

// view engine setup
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

// include routes
const routes = require('./routes/index');
app.use('/', routes);

// catch 404 then forward to error handler
app.use((req, res, next) => {
  const err = new Error('File Not Found');

  err.status = 404;
  next(err);
});

//Error handler function
//Define as the last app.use callback
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.get('/', (request, response) => {
  let result = 'App is running';
  response.send(result);
}).listen(app.get('port'), () => {
  console.log(`Application accessible here: http://localhost:${app.get('port')}`);
});

module.exports = app