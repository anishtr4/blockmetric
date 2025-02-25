import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import websiteReducer from './slices/websiteSlice';
import analyticsReducer from './slices/analyticsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    website: websiteReducer,
    analytics: analyticsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;