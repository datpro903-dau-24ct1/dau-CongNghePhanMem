import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ProtectedRoute from "./ProtectedRoute";
import Account from "./pages/Account";
import Friends from "./pages/Friends";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";


function App() {

    const user = localStorage.getItem("user");


    return (

        <BrowserRouter>

            <Routes>


                {/* =========================
                    TRANG CHỦ
                ========================= */}

                <Route
                    path="/"
                    element={
                        user
                            ? <Navigate
                                to="/home"
                                replace
                            />
                            : <Login />
                    }
                />


                {/* =========================
                    ĐĂNG NHẬP
                ========================= */}

                <Route
                    path="/login"
                    element={
                        user
                            ? <Navigate
                                to="/home"
                                replace
                            />
                            : <Login />
                    }
                />


                {/* =========================
                    ĐĂNG KÝ
                ========================= */}

                <Route
                    path="/register"
                    element={
                        user
                            ? <Navigate
                                to="/home"
                                replace
                            />
                            : <Register />
                    }
                />


                {/* =========================
                    HOME
                ========================= */}

                <Route
                    path="/home"
                    element={
                        <ProtectedRoute>
                            <Home />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    BẠN BÈ
                ========================= */}

                <Route
                    path="/friends"
                    element={
                        <ProtectedRoute>
                            <Friends />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    TIN NHẮN
                ========================= */}

                <Route
                    path="/messages"
                    element={
                        <ProtectedRoute>
                            <Messages />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    TÀI KHOẢN
                ========================= */}

                <Route
                    path="/account"
                    element={
                        <ProtectedRoute>
                            <Account />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    THÔNG BÁO
                ========================= */}

                <Route
                    path="/notifications"
                    element={
                        <ProtectedRoute>
                            <Notifications />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    ĐƯỜNG DẪN KHÔNG TỒN TẠI
                ========================= */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />


            </Routes>

        </BrowserRouter>

    );

}


export default App;