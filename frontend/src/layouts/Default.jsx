import React from "react";
import {Outlet} from "react-router-dom";
import {Switch, Route, Link} from 'react-router-dom'
import {Navbar} from './components'

function Default(){
    return(
        <div className="default-app">
            <div className="navbar">

            </div>
            <div className="main">

            </div>
            <div className="footer"></div>
        </div>
    )
}

export default Default;