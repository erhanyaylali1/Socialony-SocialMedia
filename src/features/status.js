import { createSlice } from '@reduxjs/toolkit';

export const statusSlice = createSlice({
    name: 'status',
    initialState: {
        isNavbarOpen: false,
        refresh: false,
        activeChatIndex: null,
    },
    reducers: {
        toggleNavbar: (state) => {
            state.isNavbarOpen = !state.isNavbarOpen; 
        },
        refresh: (state) => {
            state.refresh = !state.refresh;
        },
        setActiveChatIndex: (state, action) => {
            state.activeChatIndex = action.payload;
        }
    },
});

export const { toggleNavbar, refresh, setActiveChatIndex } = statusSlice.actions;
export const getRefresh = (state) =>  state.status.refresh;
export const getIsNavbarOpen = (state) =>  state.status.isNavbarOpen;
export const getActiveIndex = (state) => state.status.activeChatIndex;
export default statusSlice.reducer;