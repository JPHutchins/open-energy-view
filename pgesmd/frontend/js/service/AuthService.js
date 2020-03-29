import axios from "axios";
import cookie from "react-cookies";

class AuthService {
  login(credentials) {
    const getToken = axios.create();
    getToken.interceptors.response.use(
      response => response,
      error => {
        if (error.response.status === 401) {
          return Promise.resolve(error.response);
        }
      }
    );
    return getToken.post("/token/auth", credentials);
  }

  register(credentials) {
    const tryReg = axios.create();
    tryReg.interceptors.response.use(
      response => response,
      error => {
        if (error.response.status === 403) {
          return Promise.resolve(error.response);
        }
      }
    );
    return tryReg.post("/api/register", credentials);
  }

  getAuthHeader() {
    return {
      headers: { "X-CSRF-TOKEN": cookie.load("csrf_access_token") }
    };
  }

  refreshToken() {
    return axios.post("/token/refresh");
  }

  logOut() {
    cookie.remove("csrf_access_token");
    cookie.remove("csrf_refresh_token");
    cookie.remove("logged_in");
    return axios.post("/token/remove", this.getAuthHeader());
  }
}

export default new AuthService();
