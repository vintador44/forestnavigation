import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error_email, setErrorEmail] = useState("");
  const [error_password, setErrorPassword] = useState("");
  const navigate = useNavigate();
  const handleEmail = (value) => {
    setEmail(value);
    setErrorEmail("");
  };

  const handlePassword = (value) => {
    setPassword(value);
    setErrorPassword("");
  };

  const handleSubmit = async() => {
    if (email.length < 5 || email.length > 32)
      return setErrorEmail("Почта должна быть от 5 до 32 символов");
    setErrorEmail("");

    if (password.length < 3 || password.length > 32)
      return setErrorPassword("Пароль должен быть от 3 до 32 символов");
    setErrorPassword("");

    const request = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await request.json();

    if(request.ok && data.user ){
      // Сохраняем пользователя в localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
     
      navigate("/mainPage");
    }
    else {
      if (!data.message) data.message = "не удалось войти";
      alert(`Ошибка: ${data.message}`);
      setErrorPassword(data.message);
    }
  };

  // TODO: сделать форму смены пароля
  return (
    <div className="login-container">
      <h1>Авторизация</h1>
      <div className="input-container">
        <input
          type="text"
          value={email}
          placeholder="Введите почту"
          onChange={(e) => handleEmail(e.target.value)}
        />
      </div>
      {error_email.length > 0 && (
        <h1 className="error-message">{error_email}</h1>
      )}
      <div className="input-container">
        <input
          type="password"
          value={password}
          placeholder="Введите пароль"
          onChange={(e) => handlePassword(e.target.value)}
        />
      </div>
      {error_password.length > 0 && (
        <h1 className="error-message">{error_password}</h1>
      )}
      <button type="button" onClick={handleSubmit}>
         Войти
      </button>
      <div className="a-container">
        <NavLink to="/registration">
          <p>Забыли свой пароль?</p>
        </NavLink>
        <NavLink to="/registration">
          <p>Нет аккаунта? Регистрация</p>
        </NavLink>
      </div>
    </div>
  );
};

export default Login;