import React from "react";
import { Routes, Route } from "react-router-dom";
import {Registration} from "../pages/registration"; 
import Login from "../pages/login"; 
import MainPage from "../pages/mainPage";
import CreateLocationPage from "../pages/createLocationPage";
import CreateRoadPage from "../pages/createRoadPage";
import ViewLocationPage from "../pages/viewLocationPage";

const AppRouter = () => {
  return (
    <Routes>
      {/* Сюда прописываете маршрутизацию */}
      <Route path="/" element={<Login />} />
      <Route path="/MainPage" element={<MainPage />} />
      <Route path="/registration" element={<Registration />} />
      <Route path="/create-route" element={<CreateRoadPage />} />
      <Route path="/create-location" element={<CreateLocationPage />} />
      <Route path="/location/:location" element={<ViewLocationPage />} />
    </Routes>
  );
};

export default AppRouter;