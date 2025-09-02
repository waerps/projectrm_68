import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";


import Index from './index.jsx';

import Dash from './dash.jsx';


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
    path: "/testk",
    element: <div>"/index"Test Github ja</div>,
  },
  {
    path: "/index",
    element: <Index />,
  },
    {
    path: "/dash",
    element: <Dash />,

  },
]);



createRoot(document.getElementById('root')).render(
  // <StrictMode>
  //   <App />
  //   <App />
  // </StrictMode>,
  <RouterProvider router={router} />,
)
