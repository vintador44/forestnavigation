import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { isEmail } from 'validator';

export const Registration = () => {
  const [, setState] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [FIO, setFIO] = useState("");

  const [error_email, setErrorEmail] = useState("");
  const [error_password, setErrorPassword] = useState("");
  const [error_password2, setErrorPassword2] = useState("");
  const [error_FIO, setErrorFIO] = useState("");

  const handleEmail = (value) => {
    setEmail(value);
    setErrorEmail("");
  };
  const handlePassword = (value) => {
    setPassword(value);
    setErrorPassword("");
  };
  const handlePassword2 = (value) => {
    setPassword2(value);
    setErrorPassword2("");
  };
  const handleFIO = (value) => {
    setFIO(value);
    setErrorFIO("");
  };

  const callBackendAPI = async () => {
    const response = await fetch("/express_backend");
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message);
    }
    return body;
  };

  useEffect(() => {
    callBackendAPI()
      .then((res) => setState(res.express))
      .catch((err) => console.log(err));
  }, []);

  const handleSubmit = async() => {
    if (!FIO.trim())
      return setErrorFIO("Введите ФИО");
    setErrorFIO("");

    if (!isEmail(email))
      return setErrorEmail("Неверный формат почты");
    setErrorEmail("");

    if (password.length < 3 || password.length > 32)
      return setErrorPassword("Пароль должен быть от 3 до 32 символов");
    setErrorPassword("");

    if (password !== password2)
      return setErrorPassword2("Пароль не подходит");
    setErrorPassword2("");

    const request = await fetch("http://localhost:5000/api/registration", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, FIO }),
      method: "POST",
    });
    const response = await request.json();

    if (request.status < 200 || request.status > 299) {
      setErrorPassword(response.message);
      return setErrorPassword2("Пароль не подходит");
    }

    console.log(response);
  };

  return (
    <div className="login-container">
      <h1>Регистрация</h1>
      
      <div className="input-container">
        <input
          type="text"
          value={FIO}
          placeholder="Введите ФИО"
          onChange={(e) => handleFIO(e.target.value)}
        />
      </div>
      {error_FIO.length > 0 && (
        <h1 className="error-message">{error_FIO}</h1>
      )}
      
      <div className="input-container">
        <input
          type="text"
          value={email}
          placeholder="Введите эл. почту"
          onChange={(e) => handleEmail(e.target.value)}
        ></input>
      </div>
      {error_email.length > 0 && (
        <h1 className="error-message">{error_email}</h1>
      )}
      <div className="input-container">
        <input
          type="text"
          value={password}
          placeholder="Введите пароль"
          onChange={(e) => handlePassword(e.target.value)}
        />
      </div>
      {error_password.length > 0 && (
        <h1 className="error-message">{error_password}</h1>
      )}
      <div className="input-container">
        <input
          type="text"
          value={password2}
          placeholder="Введите пароль повторно"
          onChange={(e) => handlePassword2(e.target.value)}
        />
      </div>
      {error_password2.length > 0 && (
        <h1 className="error-message">{error_password2}</h1>
      )}
      <button type="button" onClick={handleSubmit}>
          Зарегистрироваться
      </button>
      <div className="a-container">
        <NavLink to="/">
         <p>Уже есть аккаунт? Войти</p>
        </NavLink>
      </div>
    </div>
  );
}