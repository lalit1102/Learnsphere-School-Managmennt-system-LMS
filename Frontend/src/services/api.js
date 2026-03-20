import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5918/api", // backend
  withCredentials: true,               // cookies
});

export default API;