import React from "react"
import AuthService from "./AuthService"
import DatabaseService from "./DatabaseService"
import ErrorDialog from "../components/ErrorDialog"
import Login from "../components/Login"
import cookie from "react-cookies";

export const handleErrors = (e) => {
    if (e && e.response) {
        if (e.response.status === 401) {  
            return AuthService.refreshToken()
                .then(() => {
                    cookie.save("logged_in")
                    return Promise.resolve()
                })
                .catch((e) => {
                    if (e.response.status === 401) {
                        return Promise.reject(<Login />)
                    }
                })

        }
    }
    return Promise.reject(<ErrorDialog error={e} />)
}