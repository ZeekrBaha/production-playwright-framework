import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { App, RequireAuth } from "./App";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { OrgSelectionPage } from "./pages/OrgSelectionPage";
import { ForecastListPage } from "./pages/ForecastListPage";
import { ForecastGridPage } from "./pages/ForecastGridPage";
import "./styles.css";

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: "/login", element: <LoginPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/orgs", element: <OrgSelectionPage /> },
          { path: "/orgs/:orgId", element: <ForecastListPage /> },
          { path: "/forecasts/:scenarioId", element: <ForecastGridPage /> },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  </React.StrictMode>,
);
