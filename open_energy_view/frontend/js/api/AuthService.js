import axios from "axios";
import cookie from "react-cookies";

class AuthService {
  login(credentials) {
    const getToken = axios.create();
    getToken.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response.status === 401) {
          return Promise.resolve(error.response);
        }
      }
    );
    return getToken.post("/api/web/token/auth", credentials);
  }

  register(credentials) {
    const tryReg = axios.create();
    tryReg.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response.status === 403) {
          return Promise.resolve(error.response);
        }
      }
    );
    return tryReg.post("/api/web/register", credentials);
  }

  getAuthHeader() {
    return {
      headers: { "X-CSRF-TOKEN": cookie.load("csrf_access_token") },
    };
  }

  refreshToken() {
    return axios.post(
      "/api/web/token/refresh",
      {},
      {
        headers: { "X-CSRF-TOKEN": cookie.load("csrf_refresh_token") },
      }
    );
  }

  logOut() {
    const csrf_access_token = cookie.load("csrf_access_token");
    cookie.remove("csrf_access_token");
    cookie.remove("csrf_refresh_token");
    cookie.remove("logged_in");
    return axios.post("/api/web/token/remove", csrf_access_token);
  }
}

export default new AuthService();
