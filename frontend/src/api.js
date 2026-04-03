import axios from 'axios';

const api = axios.create({
  // This tells Axios: "Use the Netlify variable if it exists, otherwise use localhost"
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5001"
});

export default api;