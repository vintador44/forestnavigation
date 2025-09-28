import React from "react";
import { Routes, Route } from "react-router-dom";
import {Registration} from "../pages/registration"; 
import Login from "../pages/login"; 
import MainPage from "../pages/mainPage";

const AppRouter = () => {
  return (
    <Routes>
      {/* Сюда прописываете маршрутизацию */}
      <Route path="/" element={<Login />} />
      <Route path="/MainPage" element={<MainPage />} />
      <Route path="/registration" element={<Registration />} />
    </Routes>
  );
};

export default AppRouter;