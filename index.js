const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { init: initDB, Counter } = require("./db");
var request = require("request");

const logger = morgan("tiny");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

// 首页
app.get("/", async (req, res) => {
  // res.sendFile(path.join(__dirname, "index.html"));
  let requestData = {
    env: "training-kp81r",
    query: 'db.collection("forW").limit(10).skip(1).get()',
  };
  // request('http://api.weixin.qq.com/wxa/getwxadevinfo', console.log);
  request(
    {
      url: "https://api.weixin.qq.com/tcb/databasequery",
      method: "POST",
      json: true,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(requestData),
    },
    function (error, response, body) {
      res.send({
        code: 0,
        data: body,
        error: error,
        response: response,
      });
    }
  );
  // res.sendFile(path.join(__dirname, "index.html"));
});

// 更新计数
app.post("/api/count", async (req, res) => {
  const { action } = req.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }
  res.send({
    code: 0,
    data: await Counter.count(),
  });
});

// 获取计数
app.get("/api/count", async (req, res) => {
  const result = await Counter.count();
  res.send({
    code: 0,
    data: result,
  });
});

// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  }
});

const port = process.env.PORT || 80;

function checkData() {
  let requestData = {
    env: "training-kp81r",
    query: 'db.collection("forW").limit(10).skip(1).get()',
  };
  // request('http://api.weixin.qq.com/wxa/getwxadevinfo', console.log);
  request(
    {
      url: "https://api.weixin.qq.com/tcb/databasequery",
      method: "POST",
      json: true,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(requestData),
    },
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(body); // 请求成功的处理逻辑
      }
    }
  );
  // sms(phone, templateId, params)
  //   .then(function () {
  //     res.json({ success: true, msg: "成功" });
  //   })
  //   .catch(function (err) {
  //     res.json({ success: false, msg: "失败" });
  //   });
}

async function bootstrap() {
  // await initDB();
  checkData();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
