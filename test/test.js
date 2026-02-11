import http from 'k6/http';

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTg5YjkyZDUxM2EwNTlhYTNlNWFmMDgiLCJhY3RvciI6IlN0dWRlbnQiLCJpYXQiOjE3NzA2MzM1MTd9.KT78j77fE5rrpKBsIQdGLSE9gLN7OGPvltozjMbRtZ0";

export const options = {
  vus: 100,
  duration: '30s',
};

export default function () {
  http.get('http://localhost:8000/api/v1/students/conversation/6989b964481a65926d9b7470/messages', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
