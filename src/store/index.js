import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './playerSlice';
import gameSessionReducer from './gameSessionSlice';

export const store = configureStore({
  reducer: {
    player: playerReducer,
    gameSession: gameSessionReducer,
  },
});
