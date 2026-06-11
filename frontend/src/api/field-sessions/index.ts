import { ApiClient } from '../../api/client';
import { axiosInstance } from '../../api/axios';

export const Api = new ApiClient(axiosInstance);
