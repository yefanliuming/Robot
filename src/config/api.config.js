const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;
const API_ROBOT_URL = process.env.VUE_APP_API_BASE_ROBOT_URL;
export default {
  baseURL: API_BASE_URL,
  robotURL: API_ROBOT_URL,
  getImageUrl() {
    return `${API_BASE_URL}/api/images/new_map.jpg`;
  },
  getLocationUrl() {
    return `${API_BASE_URL}/api/getloc`;
  },
  getreceiveMessageUrl() {
    return `${API_BASE_URL}/api/receiveMessage`;
  },
  getWebSocketUrl() {
    return `${API_BASE_URL}/ws`;
  },
  getMessage_ResponseUrl() {
    return `${API_BASE_URL}/api/message-response`;
  },
  getrgbVideoSrc(){
    return `${API_ROBOT_URL}:5001/video_feed_rgb`;
  },
  getirVideoSrc(){
    return `${API_ROBOT_URL}:5000/video_feed_ir`;
  },
  getRobotUrl(){
    return `${API_ROBOT_URL}`;
  },
  getreceiveMessage2Url() {
    return `${API_BASE_URL}/api/receiveMessage2`;
  },
  getreceiveMoveUrl() {
    return `${API_BASE_URL}/api/move`;
  },
  getreceiveBatteryUrl() {
    return `${API_BASE_URL}/api/get_battery`;
  },
};