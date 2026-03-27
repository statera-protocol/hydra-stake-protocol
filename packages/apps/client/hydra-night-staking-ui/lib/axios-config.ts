import axios from "axios";

const API_AUTH_TOKEN = process.env.API_BEARER_TOKEN ?? null;
const API_BASE_URL = process.env.API_BEARER_TOKEN ?? null;

if (!API_AUTH_TOKEN || !API_BASE_URL || API_AUTH_TOKEN == null || API_BASE_URL == null) {
  console.info(`Unable to find API bearer token`);
}

const AxiosInstance = axios.create({
  baseURL: API_BASE_URL as string,
  headers: {
    "Content-Type": 'application/json',
    Authorization: `Bearer ${API_AUTH_TOKEN}`
  }
})

export default AxiosInstance;