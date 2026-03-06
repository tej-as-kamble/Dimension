const express = require('express');
const app = express();
const mongoose = require('mongoose')
const dotenv = require('dotenv');
const cors = require('cors');

require('./models/model')
require('./models/post')

dotenv.config();
app.use(cors());
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

mongoose.connect(
  process.env.MONGO_URI,
).then(() => {
  console.log(`Database Connected`);
});

app.get('/', (req, res) => {
  res.send("Working...")
})
app.use(require("./routes/auth"));
app.use(require("./routes/createpost"));
app.use(require("./routes/user"));


const PORT = process.env.PORT_NUMBER || 5000;
app.listen(PORT, () => {
  console.log(`Connected on port ${PORT}`);
})