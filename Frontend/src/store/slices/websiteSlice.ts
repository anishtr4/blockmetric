import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Website {
  id: string;
  name: string;
  value: string;
  allowedOrigins: string[];
  apiKey: string;
}

interface WebsiteState {
  selectedWebsite: Website | null;
  websites: Website[];
}

const initialState: WebsiteState = {
  selectedWebsite: null,
  websites: []
};

const websiteSlice = createSlice({
  name: 'website',
  initialState,
  reducers: {
    setWebsites: (state, action: PayloadAction<Website[]>) => {
      state.websites = action.payload;
      // Set the first website as default if available and no website is selected
      if (action.payload.length > 0 && !state.selectedWebsite) {
        state.selectedWebsite = action.payload[0];
      }
    },
    setSelectedWebsite: (state, action: PayloadAction<Website>) => {
        console.log('rfcgvhb', action.payload);
      state.selectedWebsite = action.payload;
    }
  }
});

export const { setWebsites, setSelectedWebsite } = websiteSlice.actions;
export default websiteSlice.reducer;