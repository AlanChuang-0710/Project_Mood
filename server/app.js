const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// 導入api
const feelingRouter = require('./routes/api/feeling');
const authRouter = require('./routes/api/auth');
const settingRouter = require("./routes/api/setting");
const reportRouter = require("./routes/api/report");
const commonRouter = require("./routes/api/common");

// 導入session
const session = require("express-session");
const MongoStore = require("connect-mongo");

// 導入配置項
const { DBHOST, DBPORT, DBNAME } = require("./config/config");

const app = express();

// 設置session中間件
app.use(session({
  name: "jwt", //設置給瀏覽器的cookie的名字，默認值是connect.sid
  secret: "mood", //參與加密的字符串(又稱簽名) (安全等級加嚴)
  saveUninitialized: false, //是否為每次請求都設置一個cookie來存儲session的id
  resave: true, //是否在每次請求時重新保存session (每次請求都重新設置過期時間)
  store: MongoStore.create({
    mongoUrl: `mongodb://${DBHOST}:${DBPORT}/${DBNAME}` //設置數據庫的連接位置
  }),
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 控制sessionID的過期時間
  }
}));

// 導入cors
const cors = require('cors');
const corsOptions = {
  origin: [
    'http://localhost:8550',
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true
};

// 設置cors中間件
app.use(cors(corsOptions));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', authRouter);
app.use('/feeling', feelingRouter);
app.use('/setting', settingRouter);
app.use("/report", reportRouter);
app.use("/common", commonRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
