import React from "react";
import Layout from "client/Layout";
import Home from "client/view/home";
import Contacts from "client/view/contacts";
import Login from "client/view/login";
import Logout from "client/view/logout";
import Cabinet from "client/view/cabinet";
import AccessDenied from "client/view/access-denied";
import i18n from './i18n';
import Lottery from "client/view/lottery";
import NotFound from "client/view/notfound";
import {useRoutes} from 'hookrouter';

const routes ={
    '/':()=><Home/>,
    '/cabinet':()=><Cabinet/>
}

const AppHook =(props)=>{
    const routesResult = useRoutes(routes)
    return (
        <div>
            {routesResult}
        </div>
    )
}

export default AppHook;