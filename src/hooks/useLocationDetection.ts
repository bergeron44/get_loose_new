import { useState, useCallback, useEffect, useRef } from 'react';
import { useGame } from '@/contexts/GameContext';
import { recordBarAppEntry } from '@/utils/barStats';

interface Location {
  latitude: number;
  longitude: number;
}

interface Bar {
  _id: string;
  barName: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  qrUrl: string;
  barIp: string;
  gameStats: {
    datingGame: number;
    friendsGame: number;
    partyGame: number;
  };
}

export const useLocationDetection = () => {
  const { setCurrentBar, setUserLocation } = useGame();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);
  const permissionStatusRef = useRef<PermissionStatus | null>(null);
  const lastRecordedBarRef = useRef<string | null>(null);

  // בדיקת הרשאות
  const checkPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return false;
    }

    try {
      // בדיקה אם יש הרשאה
      if (navigator.permissions && navigator.permissions.query) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(permission.state);
        
        if (permission.state === 'denied') {
          setError('Location permission denied. Please enable location access in your browser settings.');
          return false;
        }
      }
      
      return true;
    } catch (e) {
      // Fallback: נסה בכל מקרה
      return true;
    }
  }, []);

  // קבלת מיקום נוכחי
  const getCurrentLocation = useCallback((): Promise<Location> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          resolve(location);
        },
        (err) => {
          reject(err);
        },
        {
          enableHighAccuracy: true,  // דיוק גבוה
          timeout: 10000,  // 10 שניות timeout
          maximumAge: 60000,  // מקסימום 1 דקה cache
        }
      );
    });
  }, []);

  // חישוב מרחק בין 2 נקודות (Haversine formula)
  const calculateDistance = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // רדיוס כדור הארץ במטרים
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // מרחק במטרים
  }, []);

  // מציאת בר קרוב
  const findNearestBar = useCallback(async (location: Location): Promise<Bar | null> => {
    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL; // "http://localhost:3001"
      
      const apiUrl = `${baseUrl}/api/bars/nearest?latitude=${location.latitude}&longitude=${location.longitude}&maxDistance=200`;
      console.log('🔍 [LOCATION DEBUG] Fetching nearest bars from:', apiUrl);
      
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch bars: ${response.statusText}`);
      }

      const bars: Bar[] = await response.json();
      
      console.log('📊 [LOCATION DEBUG] API returned bars:', bars.length, 'bars');
      
      if (bars.length === 0) {
        console.log('⚠️ [LOCATION DEBUG] No bars found near user location (within 200m)');
        console.log('   This is normal if you are not near any bar');
        return null;
      }
      
      bars.forEach((bar, index) => {
        const barCoords = bar.location.coordinates;
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          barCoords[1], // latitude
          barCoords[0]  // longitude
        );
        console.log(`   Bar ${index + 1}: ${bar.barName}`, {
          coordinates: barCoords,
          latitude: barCoords[1],
          longitude: barCoords[0],
          distance: distance.toFixed(2) + ' meters'
        });
      });

      // אם יש כמה ברים, נחזיר את הקרוב ביותר
      // (הם כבר מסודרים לפי מרחק מה-$near query)
      const nearestBar = bars[0];
      console.log('✅ [LOCATION DEBUG] Selected nearest bar:', nearestBar.barName);
      return nearestBar;
    } catch (err) {
      console.error('❌ [LOCATION DEBUG] Error finding nearest bar:', err);
      throw err;
    }
  }, []);

  // פונקציה ראשית: זיהוי בר
  const detectBar = useCallback(async (): Promise<Bar | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. בדיקת הרשאות
      const hasPermission = await checkPermission();
      if (!hasPermission) {
        setIsLoading(false);
        return null;
      }

      // 2. קבלת מיקום
      const location = await getCurrentLocation();
      setUserLocation(location);
      
      // LOG: מיקום המשתמש
      console.log('📍 [LOCATION DEBUG] User location:', {
        latitude: location.latitude,
        longitude: location.longitude
      });

      // 3. מציאת בר קרוב
      const nearestBar = await findNearestBar(location);

      if (nearestBar) {
        // LOG: השוואה בין מיקום המשתמש למיקום הבר
        const barLocation = nearestBar.location;
        const barCoords = barLocation.coordinates; // [longitude, latitude]
        console.log('🏢 [LOCATION DEBUG] Nearest bar found:', {
          barName: nearestBar.barName,
          barLocation: {
            type: barLocation.type,
            coordinates: barCoords,
            latitude: barCoords[1], // coordinates[1] = latitude
            longitude: barCoords[0] // coordinates[0] = longitude
          },
          userLocation: {
            latitude: location.latitude,
            longitude: location.longitude
          },
          distance: calculateDistance(
            location.latitude,
            location.longitude,
            barCoords[1], // latitude
            barCoords[0]  // longitude
          ).toFixed(2) + ' meters'
        });
        
        setCurrentBar(nearestBar);
        if (nearestBar._id && lastRecordedBarRef.current !== nearestBar._id) {
          lastRecordedBarRef.current = nearestBar._id;
          recordBarAppEntry(nearestBar._id);
        }
        return nearestBar;
      }

      return null;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to detect location';
      setError(errorMessage);
      console.error('Location detection error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [checkPermission, getCurrentLocation, findNearestBar, setCurrentBar, setUserLocation]);

  // Listener לשינויים ב-permission state
  useEffect(() => {
    if (!navigator.permissions || !navigator.permissions.query) {
      return;
    }

    let permission: PermissionStatus | null = null;
    let handlePermissionChange: ((event: Event) => void) | null = null;

    // בדיקה ראשונית והגדרת listener
    navigator.permissions.query({ name: 'geolocation' }).then((perm) => {
      permission = perm;
      permissionStatusRef.current = perm;
      setPermissionStatus(perm.state);

      // Listener לשינויים ב-permission
      handlePermissionChange = (event: Event) => {
        const status = event.target as PermissionStatus;
        const newState = status.state as 'prompt' | 'granted' | 'denied';
        setPermissionStatus(newState);
        
        // אם המשתמש מאפשר מיקום, עדכן אוטומטית
        if (newState === 'granted') {
          console.log('Location permission granted - detecting bar...');
          setShowPermissionAlert(false); // סגור אלרט אם היה פתוח
          detectBar().then((bar) => {
            if (bar) {
              console.log('Bar detected after permission granted:', bar.barName);
            }
          }).catch((err) => {
            console.log('Bar detection failed after permission granted:', err);
          });
        }
      };

      permission.addEventListener('change', handlePermissionChange);
    }).catch((err) => {
      console.log('Permission query failed:', err);
    });

    // Cleanup function
    return () => {
      if (permission && handlePermissionChange) {
        permission.removeEventListener('change', handlePermissionChange);
      }
    };
  }, [detectBar, setShowPermissionAlert]);

  return {
    detectBar,
    isLoading,
    error,
    permissionStatus,
    showPermissionAlert,
    setShowPermissionAlert,
  };
};
