import axios from "axios";
import cookie from "react-cookies";
import AuthService from "./AuthService";

const addPgeSource = (regInfo) => {
    return axios.post("/api/add/pge", regInfo, AuthService.getAuthHeader())
}

export default addPgeSource;