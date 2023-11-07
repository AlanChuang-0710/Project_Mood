// 引入 express
const express = require('express');
const router = express.Router();

// 導入用戶上傳圖片相關
const fs = require("fs");
const moment = require("moment");
const { nanoid } = require("nanoid");
const multer = require('multer');
const path = require("path");
const storage = multer.diskStorage({
    // 如果destination使用函數，則必須自己創建目標資料夾; 如果destination使用string，則multer會協助創建
    destination: function (req, file, cb) {
        // 因為form.append的關係，前端回傳的時間格式為 string "2023-11-01T16:00:00.000Z"
        req.body.timestamp = new Date(req.body.timestamp); // 限制只能存儲Date對象

        const userId = req.params.id;
        const timestamp = moment(req.body.timestamp).format("YYYY-MM-DD"); //只取年月日
        const targetIdDir = path.resolve(__dirname, `../../public/images/${userId}`);
        const targetDayDir = path.resolve(__dirname, `../../public/images/${userId}/${timestamp}`);

        if (!fs.existsSync(targetIdDir)) {
            fs.mkdirSync(targetIdDir);
        }

        if (fs.existsSync(targetDayDir)) {
            // 如果該文件夾存在，則刪除所有內部文件，第一張照片進來時，先清理掉所有照片，並將clearPhoto設為true，表示舊照片清理完畢。第二張照片進來時，就不再清理照片。
            // if (!req.body.clearPhoto) {
            //     fs.readdirSync(targetDayDir).forEach((file) => {
            //         const curPath = path.join(targetDayDir, file);
            //         fs.unlinkSync(curPath);
            //         req.body.clearPhoto = true;
            //     });
            // }
        } else {
            fs.mkdirSync(targetDayDir);
        }
        cb(null, targetDayDir);
    },
    // destination: path.resolve(__dirname, "../../public/images"),
    filename: function (req, file, cb) {
        const date = req.body.timestamp;
        const userId = req.params.id;
        const timestamp = moment(date).format("YYYY-MM-DD"); //只取年月日
        const ext = file.mimetype.split("/")[1];
        const fileName = `${file.fieldname}-${timestamp}-${nanoid(5)}.${ext}`;

        cb(null, fileName);

        // 將檔案存儲位置暫時放置req，最後由路由返回給前端
        if (!(req.body.imgURL instanceof Array)) req.body.imgURL = [];
        req.body.imgURL.push(`http://127.0.0.1:3000/images/${userId}/${timestamp}/${fileName}`);
        req.body.addPhoto = true;
    }
});
const upload = multer({ storage: storage });

// 導入情感模型
const FeelingModel = require('../../models/FeelingModel');

// 導入token較驗中間件
const { checkTokenMiddleware } = require("../../middleware/checkTokenMiddleware");

// 獲取特定用戶的一段日期/全部心情
router.get("/:id", checkTokenMiddleware, function (req, res) {
    const userId = req.params.id;
    const startTime = req.query.startTime; //api的query都會轉換成string
    const endTime = req.query.endTime; //api的query都會轉換成string

    if (startTime && endTime) {
        FeelingModel.findOne(
            { userId }
        ).then((data) => {
            let periodFeeling = data.dailyFeeling.filter((item) => item.timestamp >= startTime && item.timestamp <= endTime);
            res.json({
                code: "2000",
                msg: "A period of feeling got!",
                data: periodFeeling
            });
        }).catch((err) => {
            res.json({
                code: "2001",
                msg: "User not exists",
                data: null
            });
        });
        return;
    }

    // 獲取所有日心情
    FeelingModel.findOne({ userId }).then((data) => {
        res.json({
            code: "2000",
            msg: "All feeling got!",
            data: data
        });
    }).catch((err) => {
        res.json({
            code: "2001",
            msg: "User not exists",
            data: null
        });
    });
});

// 新建/更新特定日心情
router.post("/:id", checkTokenMiddleware, upload.array('imgURL', 3), function (req, res) {
    const userId = req.params.id;
    req.body.timestamp = req.body.timestamp instanceof Date ? req.body.timestamp : new Date(req.body.timestamp); // 限制只能存儲Date對象

    const yearMonthDateTimestamp = moment(req.body.timestamp).format("YYYY-MM-DD"); //只取年月日
    const targetDayDir = path.resolve(__dirname, `../../public/images/${userId}/${yearMonthDateTimestamp}`);

    // 如果沒有imgURL，就清空圖片
    if (!req.body.imgURL) {
        if (fs.existsSync(targetDayDir)) {
            fs.rmdirSync(targetDayDir, { recursive: true });
        }
    }

    // 沒經過muler處理 (沒有傳圖片但有傳imgURL)
    if (req.body.imgURL && !req.body.addPhoto) {

        // 只傳一個imgURL(http...)
        if (req.body.imgURL && !(req.body.imgURL instanceof Array)) {
            req.body.imgURL = [req.body.imgURL];
        }

        // 傳多個imgURL(http...) 
        const reserveList = req.body.imgURL.map((item) => {
            let newArr = item.split("/");
            return newArr[newArr.length - 1];
        });
        fs.readdirSync(targetDayDir).forEach((file) => {
            if (reserveList.indexOf(file) === -1) {
                const curPath = path.join(targetDayDir, file);
                fs.unlinkSync(curPath);
            }
        });

    }
    const timestamp = req.body.timestamp;

    FeelingModel.findOne({ userId }).then((user) => {
        if (user) {
            // 用户存在，查找是否有匹配的timestamp
            const existingEntryIndex = user.dailyFeeling.findIndex(item => item.timestamp.toString() == timestamp.toString());
            if (existingEntryIndex !== -1) {
                user.dailyFeeling[existingEntryIndex] = { ...req.body };
            } else {
                let insertIndex = 0;
                const result = user.dailyFeeling.every((item, index) => {
                    if (item.timestamp.getTime() > timestamp.getTime()) {
                        insertIndex = index;
                        return false;
                    }
                    return true;
                });
                if (result) {
                    insertIndex = user.dailyFeeling.length;
                }
                user.dailyFeeling.splice(insertIndex, 0, { ...req.body });
            }
            // 保存更新后的用户数据
            user.save().then((data) => {
                res.json({
                    code: "2000",
                    msg: existingEntryIndex !== -1 ? "Feeling revised" : "New feeling created",
                    data: existingEntryIndex !== -1 ? data.dailyFeeling[existingEntryIndex] : data.dailyFeeling[0]
                });
            });
        } else {
            const newUser = new FeelingModel({
                userId,
                dailyFeeling: [{ ...req.body }]
            });
            newUser.save().then((data) => {
                res.json({
                    code: "2000",
                    msg: "New feeling created",
                    data: data.dailyFeeling[0]
                });
            });
        };
    }).catch((err) => {
        console.log(err);
        res.json({
            code: "5000",
            msg: err,
            data: null
        });
    });
});

// 刪除特定日心情
router.delete("/:id/:feelingId", checkTokenMiddleware, async (req, res) => {
    try {
        const userId = req.params.id;
        const feelingId = req.params.feelingId;

        const user = await FeelingModel.findOne({ userId });

        if (user) {
            const existingEntryIndex = user.dailyFeeling.findIndex(item => item.id == feelingId);
            if (existingEntryIndex !== -1) {

                // 刪除images
                let [{ timestamp }] = user.dailyFeeling.splice(existingEntryIndex, 1);
                let yearMonthDateTimestamp = moment(timestamp).format("YYYY-MM-DD");
                const targetDayDir = path.resolve(__dirname, `../../public/images/${userId}/${yearMonthDateTimestamp}`);
                fs.rmdirSync(targetDayDir, { recursive: true });

                await user.save();
                res.json({
                    code: "2000",
                    msg: "Feeling deleted!",
                    data: null
                });
            } else {
                res.json({
                    code: "2000",
                    msg: "Feeling not exists!",
                    data: null
                });
            }
        } else {
            throw new Error();
        }
    } catch (err) {
        res.json({
            code: "2002",
            msg: "User not exists",
            data: null
        });
    }
});

module.exports = router;
