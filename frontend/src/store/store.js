import { configureStore } from '@reduxjs/toolkit'
import agentsReducer from './agentsSlice'

export const store = configureStore({
  reducer: {
    agents: agentsReducer,
  },
})