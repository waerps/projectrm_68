import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

const router = createBrowserRouter([
  {
    path: "/", //router
    element: <div>Hello World</div>,
  },
  {
    path: "/p",
    element: <App />,
  },
  {
    path: "/test",
    element: <div>"/index"Test Github ja</div>,
  }
]);



createRoot(document.getElementById('root')).render(
  // <StrictMode>
  //   <App />
  //   <App />
  // </StrictMode>,
  <RouterProvider router={router} />,
)
