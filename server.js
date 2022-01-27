const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

// uncaught exception
process.on('uncaughtException', (err) => {
  console.log(err.name, ' | ', err.message);
  console.log('UNCAUGHT EXCEPTION!!! . SHUTTING DOWN THE APP...');
  process.exit(1);
});

const app = require('./app');
//database connection
const db = process.env.DATABASE.replace('<password>', process.env.DATABASE_PASSWORD);
mongoose
  // .connect(process.env.DATABASE_LOCAL, {
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((connection) => {
    // console.log(connection.connections);
    console.log('DB connecton successfully');
  });
// .catch((error) => {
//   console.log('error');
// });

const PORT = process.env.PORT || 3000;
// console.log(process.env.PASSWORD);

const server = app.listen(PORT, () => {
  console.log(`app runing on port : ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, ' | ', err.message);
  console.log('UNHANDLED REJECTION PROBLEM . SHUTTING DOWN THE APP...');
  server.close(() => {
    process.exit(1);
  });
});
