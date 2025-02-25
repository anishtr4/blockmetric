import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Website, getWebsites } from '../services/websiteService';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { setWebsites as setReduxWebsites, setSelectedWebsite as setReduxSelectedWebsite } from '../store/slices/websiteSlice';

interface WebsiteContextType {
  selectedWebsite: Website | null;
  setSelectedWebsite: (website: Website) => void;
  websites: Website[];
  loading: boolean;
  error: string | null;
}

const WebsiteContext = createContext<WebsiteContextType | undefined>(undefined);

export function WebsiteProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const { websites, selectedWebsite } = useSelector((state: RootState) => state.website);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const data = await getWebsites();
        dispatch(setReduxWebsites(data));
        // Automatically select the first website if available and none is selected
        if (data.length > 0 && !selectedWebsite) {
            console.log('website',data[0]);
          dispatch(setReduxSelectedWebsite(data[0]));
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch websites');
        setLoading(false);
      }
    };

    fetchWebsites();
  }, [dispatch]);

  const handleSetSelectedWebsite = (website: Website | null) => {
    if (!website) return;
    // Find the complete website object from the websites array
    const completeWebsite = websites.find(w => w.id === website);
    console.log('completeWebsite',completeWebsite);
    console.log('website',website);
    if (!completeWebsite) {
      console.warn('Website not found in the websites array');
      return;
    }
    
    // Ensure we dispatch the complete website object with all necessary fields
    dispatch(setReduxSelectedWebsite({
      id: completeWebsite.id,
      name: completeWebsite.name,
      value: completeWebsite.value,
      allowedOrigins: completeWebsite.allowedOrigins,
      apiKey: completeWebsite.apiKey
    }));
  };

  return (
    <WebsiteContext.Provider value={{
      selectedWebsite,
      setSelectedWebsite: handleSetSelectedWebsite,
      websites,
      loading,
      error
    }}>
      {children}
    </WebsiteContext.Provider>
  );
}

export function useWebsite() {
  const context = useContext(WebsiteContext);
  if (context === undefined) {
    throw new Error('useWebsite must be used within a WebsiteProvider');
  }
  return context;
}