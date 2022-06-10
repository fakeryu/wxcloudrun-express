const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { init: initDB, Counter } = require("./db");
const request = require("request");
const dayjs = require("dayjs");
const sms = require("./sms");
const schedule = require("node-schedule");

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
    query:
      'db.collection("excel").limit(100).skip(0).orderBy("rowId", "asc").get()',
  };
  // request(
  //   {
  //     url: "https://api.weixin.qq.com/tcb/databasequery",
  //     method: "POST",
  //     json: true,
  //     headers: {
  //       "content-type": "application/json",
  //     },
  //     body: requestData,
  //   },
  //   function (error, response, body) {
  //     var data = body.data || [];
  //     if (data.length) {
  //       const needNoticeData = data.filter((item) => {
  //         item = JSON.parse(item);
  //         return dayjs().isAfter(dayjs(item.endTime).subtract(7, "day"), "day");
  //       });
  //       res.send({
  //         code: 0,
  //         data: needNoticeData,
  //         error: null,
  //         response: Math.ceil(needNoticeData.length / 6),
  //       });
  //       // if (needNoticeData.length) {
  //       //   for (
  //       //     let index = 0;
  //       //     index < Math.ceil(needNoticeData.length / 6);
  //       //     index++
  //       //   ) {
  //       //     let params = needNoticeData
  //       //       .slice(index * 6, (index + 1) * 6)
  //       //       .map((item) => {
  //       //         item = JSON.parse(item);
  //       //         return item.rowId;
  //       //       })
  //       //       .join(",");
  //       //     res.send({
  //       //       code: 0,
  //       //       data: needNoticeData,
  //       //       error: null,
  //       //       response: Math.ceil(needNoticeData.length / 6),
  //       //     });
  //       //     // sms(13540887226, 1434418, [params])
  //       //     //   .then(function () {
  //       //     //     res.send({
  //       //     //       code: 0,
  //       //     //       data: needNoticeData,
  //       //     //       error: null,
  //       //     //       response: Math.ceil(needNoticeData.length / 6),
  //       //     //     });
  //       //     //     console.log("短信发送成功");
  //       //     //   })
  //       //     //   .catch(function (err) {
  //       //     //     res.send({
  //       //     //       code: 0,
  //       //     //       data: params,
  //       //     //       error: err,
  //       //     //       response: Math.ceil(needNoticeData.length / 6),
  //       //     //     });
  //       //     //   });
  //       //   }
  //       // }
  //     }
  //   }
  // );
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

/**
 * 将数组拆分成多个指定长度的区块
 * @example
 *
 */
const chunk = (arr = [], size = 1) => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );
};

function checkData() {
  let requestData = {
    env: "training-kp81r",
    query:
      'db.collection("excel").limit(100).skip(0).orderBy("rowId", "asc").get()',
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
      body: requestData,
    },
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        const data = body.data || [];
        if (data.length) {
          const needNoticeData = data.filter((item) => {
            item = JSON.parse(item);
            return dayjs().isAfter(
              dayjs(item.endTime).subtract(7, "day"),
              "day"
            );
          });
          if (needNoticeData.length) {
            for (
              let index = 0;
              index < Math.ceil(needNoticeData.length / 6);
              index++
            ) {
              let params = needNoticeData
                .slice(index * 6, (index + 1) * 6)
                .map((item) => {
                  item = JSON.parse(item);
                  return item.rowId;
                })
                .join(",");
              // console.log(params);
              sms(13540887226, 1434418, [params])
                .then(function () {
                  console.log("短信发送成功");
                })
                .catch(function (err) {
                  console.log("短信发送失败");
                });
            }
          }
        }
      }
    }
  );
}

async function bootstrap() {
  // await initDB();
  // schedule.scheduleJob("0 0 10 * * *", () => {
  checkData();
  // });

  // sms(13540887226, 1434418, [123])
  // .then(function () {
  //   console.log("短信发送成功");
  // })
  // .catch(function (err) {
  //   console.log("短信发送失败");
  // });
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
