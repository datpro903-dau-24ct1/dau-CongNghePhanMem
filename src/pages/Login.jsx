import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost/it-connect-php/auth/login.php",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message);
                setLoading(false);
                return;
            }

            // Lưu thông tin người dùng
            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            setLoading(false);

            // Chuyển sang trang chủ
            navigate("/home");

        } catch (error) {
            console.error(error);

            setError(
                "Không thể kết nối đến PHP server!"
            );

            setLoading(false);
        }
    };

    return (
        <div className="auth-page">

            <div className="auth-box">

                <div className="auth-left">

                    <h1>IT Community</h1>

                    <p>
                        Kết nối sinh viên Khoa Công nghệ thông tin
                    </p>

                </div>

                <div className="auth-right">

                    <h2>Đăng nhập</h2>

                    <p className="auth-subtitle">
                        Chào mừng bạn quay trở lại!
                    </p>

                    <form onSubmit={handleLogin}>

                        <div className="form-group">

                            <label>Email</label>

                            <input
                                type="email"
                                placeholder="Nhập email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                            />

                        </div>

                        <div className="form-group">

                            <label>Mật khẩu</label>

                            <input
                                type="password"
                                placeholder="Nhập mật khẩu"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                            />

                        </div>

                        {error && (
                            <p className="login-error">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                        >
                            {loading
                                ? "Đang đăng nhập..."
                                : "Đăng nhập"}
                        </button>

                    </form>

                    <p className="switch-auth">

                        Chưa có tài khoản?

                        <Link to="/register">
                            {" "}Đăng ký
                        </Link>

                    </p>

                </div>

            </div>

        </div>
    );
}

export default Login;