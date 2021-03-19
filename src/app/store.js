import { configureStore } from '@reduxjs/toolkit';
import userSlice from '../features/userSlice';
import statusSlice from '../features/status';

export default configureStore({
    reducer: {
        user: userSlice,
        status: statusSlice
    },
});
