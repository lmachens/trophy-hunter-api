import axios from 'axios';

const thApi = axios.create({
  baseURL: 'https://api-lol.th.gl/'
});

export default thApi;
