var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  req.app.locals.db.collection('points').findOne({}, function(err, result) {
    if (err) throw err;
    console.log(result);
    res.render('index', { title: 'Trckr', point: result});
  });
});

module.exports = router;
