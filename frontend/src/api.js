import axios from 'axios';

const api = axios.create({
  // This tells Axios: "Use the Netlify variable if it exists, otherwise use localhost"
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5001"
});

api.interceptors.request.use(
    (config) => {        
        const stored = localStorage.getItem('charmingUser');
        if (stored) {
            const parsedUser = JSON.parse(stored);
            if (parsedUser.token) {
                config.headers = config.headers || {};
                config.headers.Authorization = `Bearer ${parsedUser.token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;