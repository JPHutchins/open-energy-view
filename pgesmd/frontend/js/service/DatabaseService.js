import axios from "axios";
import AuthService from "./AuthService";

export const addPgeSource = (regInfo) => {
  return axios.post("/api/add/pge", regInfo, AuthService.getAuthHeader());
};

export const getData = (source) => {
  return axios.post(
    "/api/data",
    { source: source },
    AuthService.getAuthHeader()
  );
};
