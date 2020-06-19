const express = require('express');
const router = express.Router();
const User = require('../models/user');
const mid = require('../middleware');
const got = require('got');
const cache = require('memory-cache');
const Msg = require('../models/mb');
const Comment = require('../models/comment');
const newsApiKey = `News API key here`;

//Function to sort JSON file received
function sortJSON(prop) {
  return (a, b) => {
    if (a[prop][0] > b[prop][0]) {
      return 1;
    } else if (a[prop][0] < b[prop][0]) {
      return -1;
    }
    return 0;
  };
}

//GET Request - Loads the login page
router.get('/login', mid.loggedOut, (req, res, next) => {
  return res.render('login', { title: 'Log In' });
});

//GET Request - Loads the registration page
router.get('/register', mid.loggedOut, (req, res, next) => {
  return res.render('register', { title: 'Sign Up' });
});

//GET Request - Loads the home page
router.get('/', (req, res, next) => {
  return res.render('index', { title: 'Home' });
});

//GET Request - Loads the tips page
router.get('/tips', (req, res, next) => {
  //Async request for United States Stats
  (async () => {
    try {
      const response = await got('https://wuhan-coronavirus-api.laeyoung.endpoint.ainize.ai/jhu-edu/latest?iso2=US');
      if (response.statusCode >= 200 && response.statusCode < 400) {
        const parsedData = JSON.parse(response.body);
        let statsDisplay = [];

        const content = {
          'confirmed': Number(parsedData[0].confirmed).toLocaleString(),
          'recovered': Number(parsedData[0].recovered).toLocaleString(),
          'date': new Date(parseInt(Date.parse(parsedData[0].lastupdate))),
          'death': Number(parsedData[0].deaths).toLocaleString()
        };
        statsDisplay.push(content);

        //Async request for State Stats
        (async () => {
          try {
            let stateData = [];
            console.log('Parsing state data...');
            const responses = await got(`https://corona.lmao.ninja/v2/states?sort&yesterday`);
            if (responses.statusCode >= 200 && responses.statusCode < 400) {
              const parsedState = JSON.parse(responses.body);

              //Sort JSON
              parsedState.sort(sortJSON('state'));

              //Push sorted objects into array
              for (var i = 0; i < 54; i++) {
                //Filter out some of the objects (Looking for only states)
                if (parsedState[i].state != 'Diamond Princess Ship'
                  && parsedState[i].state != 'Grand Princess Ship'
                  && parsedState[i].state != 'Federal Prisons'
                  && parsedState[i].state != 'Northern Mariana Islands'
                  && parsedState[i].state != 'United States Virgin Islands') {
                  let contentState = {
                    'Totaldeath': Number(parsedState[i].deaths).toLocaleString(),
                    'Totalcases': Number(parsedState[i].cases).toLocaleString(),
                    'case': Number(parsedState[i].todayCases).toLocaleString(),
                    'death': Number(parsedState[i].todayDeaths).toLocaleString(),
                    'name': String(parsedState[i].state)
                  };
                  stateData.push(contentState);
                }
              }
            }
            //Sends page title, US stats, and state stats
            res.render('tips', { title: 'Tips/Safety', stats: statsDisplay, states: stateData });
          } catch (error) {
            console.error('error - /tips:', error);
            console.error('error - /tips response body', error.response.body);
          }
        })();
      }
    } catch (error) {
      console.error('error - /tips:', error);
      console.error('error - /tips response body', error.response.body);
    }
  })();
});

//GET Request - Loads the message page
router.get('/message', (req, res, next) => {
  //If user logged in
  if (req.session.userId) {
    //Find specific user from DB
    User.findById(req.session.userId)
      .exec((error, user) => {
        if (error) {
          return next(error);
        }
        else {
          let messageDisplay = [];
          //Query for all messages
          Msg.find({}, function (err, document) {
            //Query for all comments
            Comment.find({}, function (err, element) {
              for (let i = 0; i < document.length; i++) {
                var comments = [];
                for (let j = 0; j < element.length; j++) {
                  //Attached comment to the corresponding parent message
                  if (element[j].parentId == document[i].id) {
                    //Checks if post is made by current user
                    if (element[j].from == user.name) {
                      comments.push({
                        'content': element[j].content,
                        'from': element[j].from,
                        'id': element[j].id,
                        'authCmt': 1
                      });
                    } else {
                      comments.push({
                        'content': element[j].content,
                        'from': element[j].from,
                        'id': element[j].id,
                        'authCmt': 2
                      });
                    }
                  }
                  //Ideal would change this to unique user id instead of name
                  if (user.name == document[i].name) {
                    const content = {
                      'title': document[i].articleTitle,
                      'name': document[i].name,
                      'Msg': document[i].message,
                      'id': document[i].id,
                      'comments': comments,
                      'authMsg': 1
                    };
                    messageDisplay.unshift(content);
                  } else {
                    const content = {
                      'title': document[i].articleTitle,
                      'name': document[i].name,
                      'Msg': document[i].message,
                      'id': document[i].id,
                      'comments': comments,
                      'authMsg': 2
                    };
                    messageDisplay.unshift(content);
                  }
                }
                // Checks if message is by current user
                if (user.name == document[i].name) {
                  const content = {
                    'title': document[i].articleTitle,
                    'name': document[i].name,
                    'Msg': document[i].message,
                    'id': document[i].id,
                    'comments': comments,
                    'authMsg': 1
                  };
                  messageDisplay.unshift(content);
                } else {
                  const content = {
                    'title': document[i].articleTitle,
                    'name': document[i].name,
                    'Msg': document[i].message,
                    'id': document[i].id,
                    'comments': comments,
                    'authMsg': 2
                  };
                  messageDisplay.unshift(content);
                }
              }
              return res.render('message', { title: 'Message Board', boardContent: messageDisplay });
            }).select('-__v');
          });
        }
      });
    //If user is not logged in
  } else {
    let messageDisplay = [];
    Msg.find({}, function (err, document) {
      Comment.find({}, function (err, element) {
        for (let i = 0; i < document.length; i++) {
          var comments = [];
          for (let j = 0; j < element.length; j++) {
            if (element[j].parentId == document[i].id) {
              comments.push({
                'content': element[j].content,
                'from': element[j].from,
                'id': element[j].id,
                'authCmt': 2
              });
            }
          }
          const content = {
            'title': document[i].articleTitle,
            'name': document[i].name,
            'Msg': document[i].message,
            'id': document[i].id,
            'comments': comments,
            'authMsg': 2
          };
          messageDisplay.unshift(content);
        }
        return res.render('message', { title: 'Message Board', boardContent: messageDisplay });
      }).select('-__v');
    });
  }
});

router.post('/message', (req, res, next) => {
  console.log('POST request to /message');
  // Delete Messages
  if (req.body.whatToDel) {
    Msg.findByIdAndDelete(req.body.whatToDel).exec((error) => {
      if (error) {
        console.error('message not found');
        let err = new Error('Please try again');
        err.status = 401;
        return next(err);
      } else {
        console.log('sucessfully deleted message');
        res.redirect('/message');
      }
    });
    // Update Message
  } else if (req.body.whatToEdit) {
    Msg.findByIdAndUpdate(req.body.whatToEdit,
      {
        articleTitle: req.body.editTitle,
        message: req.body.editMsg
      }).exec((error) => {
        if (error) {
          console.error('unable to update message');
          let err = new Error('Please try again');
          err.status = 401;
          return next(err);
        } else {
          console.log('successfully updated message');
          res.redirect('/message');
        }
      });
    // Del Comments
  } else if (req.body.commentToDel) {
    console.log(req.body.commentToDel);
    Comment.findByIdAndDelete(req.body.commentToDel).exec((error) => {
      if (error) {
        console.error('comment not found');
        let err = new Error('Please try again');
        err.status = 401;
        return next(err);
      } else {
        console.log('successfully deleted message');
        res.redirect('/message');
      }
    });
    // Create Messages
  } else if ((req.body.question != '') &&
    req.body.articleTitle) {
    User.findById(req.session.userId)
      .exec((error, user) => {
        if (error) {
          console.error("Not logged in");
          let err = new Error('Please log in to view messageboard');
          err.status = 401;
          return next(err);
        }
        else {
          const articleData = {
            name: user.name,
            message: req.body.question,
            articleTitle: req.body.articleTitle
          };
          Msg.create(articleData, (error, article) => {
            if (error) {
              return next(error);
            }
            else {
              console.log("sucessfully posted message");
              return res.redirect('/message');
            }
          });
        }
      });
  }
  else if (req.body.content) {
    User.findById(req.session.userId)
      .exec((error, user) => {
        if (error) {
          console.error("Not logged in");
          let err = new Error('Please log in to view messageboard');
          err.status = 401;
          return next(err);
        }
        else {
          req.body.from = user.name;
          const data = new Comment(req.body).save();
          return res.redirect('/message');
        }
      });
  }
  else {
    console.error("User hasn't entered all fields. Not possible, all fields required!");
    let err = new Error('All fields required!');
    err.status = 400;
    return next(err);
  }
});


// GET /profile
router.get('/profile', (req, res, next) => {
  console.log("The session data (within profile): ", req.session);
  User.findById(req.session.userId)
    .exec((error, user) => {
      if (error) {
        console.error("Not logged in");
        let err = new Error('Please log in to view messageboard');
        err.status = 401;
        return next(err);
      }
      else {
        let messageDisplay = [];
        Msg.find({}, function (err, document) {
          for (let i = 0; i < document.length; i++) {
            if (document[i].name == user.name) {
              let content = {
                'title': document[i].articleTitle,
                'name': document[i].name,
                'Msg': document[i].message,
              };
              messageDisplay.push(content);
            }
          }
          if (messageDisplay.length > 0) {
            return res.render('profile', { title: 'Profile', name: user.name, email: user.email, msg: messageDisplay });
          } else {
            return res.render('profile', { title: 'Profile', name: user.name, email: user.email });
          }
        });
      }
    });
});

// GET /logout
router.get('/logout', (req, res, next) => {
  if (req.session) {
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        console.log("Logging out!");
        return res.redirect('/');
      }
    });
  }
});

// POST /login
router.post('/login', (req, res, next) => {
  if (req.body.email && req.body.password) {
    User.authenticate(req.body.email, req.body.password, function (error, user) {
      if (error || !user) {
        console.error("error when authenticating! 401 status");
        let err = new Error('Wrong email AND/OR Password!');
        err.status = 401;
        return next(err);
      }
      else {
        console.log("redirect to /profile page");
        req.session.userId = user.id;
        user_login = user.id;
        return res.redirect('/profile');
      }
    });
  }
  else {
    console.error("User didn't enter username and/or password; 401 status");
    let err = new Error('Email & Password Required!');
    err.status = 401;
    return next(err);
  }
});


// POST /register
router.post('/register', (req, res, next) => {
  console.log("POST request to /register page, checking inputed fields!");
  if (req.body.email &&
    req.body.name &&
    req.body.password &&
    req.body.confirmPassword) {
    console.log(req.body);

    if (req.body.password !== req.body.confirmPassword) {
      console.error("Password and Confirm Password don't match! 400 status");
      let err = new Error('Passwords do not match.');
      err.status = 400;
      return next(err);
    }

    let userData = {
      email: req.body.email,
      name: req.body.name,
      password: req.body.password
    };

    User.create(userData, (error, user) => {
      if (error) {
        return next(error);
      }
      else {
        console.log("Session assigned to user on login!");
        req.session.userId = user._id;
        return res.redirect('/profile');
      }
    });
  }
  else {
    console.error("User hasn't entered all fields. Not possible, all fields required!");
    let err = new Error('All fields required!');
    err.status = 400;
    return next(err);
  }
});


// GET /news
router.get('/news', (req, res, next) => {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const year = today.getFullYear();
  const url = `http://newsapi.org/v2/everything?q=covid-19&from=${year}-${month}-${day}&sortBy=relevancy&apiKey=${newsApiKey}`;

  const date = { 'month': month, 'day': day, 'year': year };

  (async () => {
    try {
      const response = await got(url);

      if (response.statusCode >= 200 && response.statusCode < 400) {
        const parsedData = JSON.parse(response.body);
        let newsDisplay = [];

        for (let i = 0; i < 7; i++) {
          const content =
          {
            'title': parsedData['articles'][i].title,
            'description': parsedData['articles'][i].description,
            'link': parsedData['articles'][i].url,
            'author': parsedData['articles'][i].author
          };
          newsDisplay.push(content);
        }
        res.render('news', { title: 'News', newsContent: newsDisplay, currentDate: date });
      }
    } catch (error) {
      console.error('ERROR - /news:', error);
      console.error("ERROR - /news Response Body: ", error.response.body);
    }
  })();
});

// serving as the endpoint for making a request for COVID-19 Data
router.get('/api', (req, res, next) => {

  const covidURL = `http://coronavirusapi.com/getTimeSeriesJson/${req.query.state || defaultState}`;

  (async () => {
    try {
      const response = await got(covidURL);

      if (response.statusCode >= 200 && response.statusCode < 400) {
        const parsedData = JSON.parse(response.body);
        let testCount = [];
        let positiveCount = [];
        let deathCount = [];
        let date = [];

        for (let x = 0; x < parsedData.length; x++) {
          testCount.push((parsedData[x]).tested);
          positiveCount.push((parsedData[x]).positive);
          deathCount.push((parsedData[x]).deaths);
          date.push(new Date((parsedData[x].seconds_since_epoch) * 1000).toLocaleString('en-us', { month: 'long', day: 'numeric' }));
        }

        res.json({ testCount: testCount, positiveCount: positiveCount, deathCount: deathCount, date: date });
      }
    } catch (error) {
      console.error('ERROR - /api:', error);
      console.error("ERROR - /api Response Body: ", error.response.body);
    }
  })();
});

module.exports = router;
