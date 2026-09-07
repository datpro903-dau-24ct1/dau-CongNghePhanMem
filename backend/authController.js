const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();

app.use(cors());
app.use(express.json());
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authController = require("./authController");

// Đăng ký
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Kiểm tra dữ liệu
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ thông tin"
            });
        }

        // Kiểm tra email đã tồn tại
        const [users] = await req.db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (users.length > 0) {
            return res.status(400).json({
                message: "Email đã được sử dụng"
            });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Thêm user
        await req.db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, "user"]
        );

        res.status(201).json({
            message: "Đăng ký thành công"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Lỗi server"
        });
    }
};


// Đăng nhập
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra dữ liệu
        if (!email || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập email và mật khẩu"
            });
        }

        // Tìm user
        const [users] = await req.db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Email hoặc mật khẩu không đúng"
            });
        }

        const user = users[0];

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Email hoặc mật khẩu không đúng"
            });
        }

        // Tạo JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            "SECRET_KEY",
            {
                expiresIn: "1d"
            }
        );

        res.json({
            message: "Đăng nhập thành công",
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Lỗi server"
        });
    }
};
app.post("/api/auth/register", async (req, res) => {
    req.db = db;
    await authController.register(req, res);
});

app.post("/api/auth/login", async (req, res) => {
    req.db = db;
    await authController.login(req, res);
});
app.listen(5000, () => {
    console.log("🚀 Server chạy tại http://localhost:5000");
});