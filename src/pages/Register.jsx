import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [studentCode, setStudentCode] = useState("");
    const [className, setClassName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        // Kiểm tra mật khẩu
        if (password !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp!");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost/it-connect-php/auth/register.php",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        password: password,
                        student_code: studentCode,
                        class: className
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message);
                setLoading(false);
                return;
            }

            setMessage(data.message);
            setLoading(false);

            // Chuyển sang đăng nhập
            setTimeout(() => {
                navigate("/login");
            }, 1000);

        } catch (error) {
            console.error(error);

            setError(
                "Không thể kết nối đến PHP server!"
            );

            setLoading(false);
        }
    };

    return (
        <div className="register-page">

            <div className="register-box">

                {/* LEFT */}
                <div className="register-left">

                    <h1>IT Community</h1>

                    <p>
                        Cộng đồng sinh viên Khoa Công nghệ thông tin
                    </p>

                    <div className="register-intro">
                        <p>✓ Kết nối với bạn bè</p>
                        <p>✓ Chia sẻ kiến thức</p>
                        <p>✓ Trao đổi và học tập</p>
                    </div>

                </div>

                {/* RIGHT */}
                <div className="register-right">

                    <h2>Tạo tài khoản</h2>

                    <p className="register-subtitle">
                        Tham gia cộng đồng IT ngay hôm nay
                    </p>

                    <form onSubmit={handleRegister}>

                        {/* HỌ TÊN */}
                        <div className="register-form-group">
                            <label>Họ và tên</label>

                            <input
                                type="text"
                                placeholder="Nhập họ và tên"
                                value={name}
                                onChange={(e) =>
                                    setName(e.target.value)
                                }
                            />
                        </div>

                        {/* EMAIL */}
                        <div className="register-form-group">
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

                        {/* MÃ SINH VIÊN */}
                        <div className="register-form-group">
                            <label>Mã sinh viên</label>

                            <input
                                type="text"
                                placeholder="Nhập mã sinh viên"
                                value={studentCode}
                                onChange={(e) =>
                                    setStudentCode(e.target.value)
                                }
                            />
                        </div>

                        {/* LỚP */}
                        <div className="register-form-group">
                            <label>Lớp</label>

                            <input
                                type="text"
                                placeholder="Ví dụ: 24CT1"
                                value={className}
                                onChange={(e) =>
                                    setClassName(e.target.value)
                                }
                            />
                        </div>

                        {/* MẬT KHẨU */}
                        <div className="register-form-group">
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

                        {/* XÁC NHẬN */}
                        <div className="register-form-group">
                            <label>Xác nhận mật khẩu</label>

                            <input
                                type="password"
                                placeholder="Nhập lại mật khẩu"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                            />
                        </div>

                        {/* THÔNG BÁO */}
                        {error && (
                            <p className="register-error">
                                {error}
                            </p>
                        )}

                        {message && (
                            <p className="register-success">
                                {message}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                        >
                            {loading
                                ? "Đang đăng ký..."
                                : "Đăng ký"}
                        </button>

                    </form>

                    <p className="switch-register">
                        Đã có tài khoản?

                        <Link to="/login">
                            {" "}Đăng nhập
                        </Link>
                    </p>

                </div>

            </div>

        </div>
    );
}

export default Register;