import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://api-lol.th.gl/'
});

export default instance;
