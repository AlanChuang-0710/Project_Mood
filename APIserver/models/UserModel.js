const mongoose = require("mongoose");

// 設置集合中 文檔的屬性及屬性值
let UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    membership: {
        type: String,
        enum: ["free", "common", "vip"],
        default: "free"
    },
    phone: {
        type: String,
    },
    gender: {
        type: Number,
        enum: [1, 2, 3]
    },
    lastLoginTime: {
        type: Date,
        default: Date.now(),
        required: true,
    }
}, {
    timestamps: true
});

UserSchema.statics.createDefaultUser = async function ({ username, email, password, membership = "free" }) {
    const defaultData = {
        username,
        email,
        password,
        membership
    };
    return await this.create(defaultData);
};

// 創建模型對象，對文檔操作的封裝對象 mongoose會自動以 複數名稱 創建集合
let UserModel = mongoose.model("users", UserSchema);

//暴露模型對象
module.exports = UserModel;