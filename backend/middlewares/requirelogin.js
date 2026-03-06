const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const user = mongoose.model('USER')

module.exports = (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({ error: "You must Sign In before" })
  }
  const token = authorization.replace("Bearer ", "")
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {

    if (err) {
      res.status(401).json({ error: "Error Occur" })
    }
    const { _id } = payload;
    user.findById(_id).then((userdata) => {
      req.value = userdata
      next();
    })
  })

}