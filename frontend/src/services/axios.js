import axios from 'axios';


const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/v1/",
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                
                if (!refreshToken) {
                    throw new Error("No refresh token");
                }

                const response = await axios.post("http://127.0.0.1:8000/api/v1/user/token/refresh/", {
                    refresh: refreshToken
                });

                const newAccessToken = response.data.access; 

                localStorage.setItem('access_token', newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                return api(originalRequest);

            } catch (refreshError) {
                console.error("Refresh token expired, logging out...");
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');

                window.location.href = '/'; 
                
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);
export default api;


//http only cookies


