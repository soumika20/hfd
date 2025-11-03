import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Home, Edit, Menu, User, ChevronRight, MapPin, Phone, Video, Camera, Image, AlertCircle, Navigation, Heart, Cloud, CloudRain, Wind, Thermometer, Activity, Wifi, WifiOff, Radio, Users } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('action');
  const [userLocation, setUserLocation] = useState({ lat: 12.9716, lng: 77.5946 });
  const [weather, setWeather] = useState(null);
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const [meshStatus, setMeshStatus] = useState('disconnected');
  const [meshPeers, setMeshPeers] = useState([]);
  const [meshMessages, setMeshMessages] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [meshNode, setMeshNode] = useState(null);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [showEmergencyCallMenu, setShowEmergencyCallMenu] = useState(false);
  const [selectedEmergencyType, setSelectedEmergencyType] = useState(null);
  
  // Live clock update
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Emergency timer states
  const [emergencyTimers, setEmergencyTimers] = useState({});
  const [emergencyUpdates, setEmergencyUpdates] = useState([]);

  // STEP 1: Replace with your WeatherAPI.com API key
  const WEATHER_API_KEY = 'bf8edeaa51844f2caad151032252110';


  // Mesh Network Manager
  const MeshNetworkManager = useCallback(() => {
    let ws = null;
    let reconnectTimer = null;
    let heartbeatTimer = null;

    const connect = () => {
      try {
        ws = new WebSocket('ws://localhost:9001');
        
        ws.onopen = () => {
          console.log('Mesh network connected');
          setMeshStatus('connected');
          
          const handshake = {
            type: 'handshake',
            peerId: generatePeerId(),
            location: userLocation,
            timestamp: Date.now()
          };
          ws.send(JSON.stringify(handshake));
          
          heartbeatTimer = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'heartbeat' }));
            }
          }, 30000);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            handleMeshMessage(message);
          } catch (e) {
            console.error('Failed to parse mesh message:', e);
          }
        };

        ws.onerror = (error) => {
          console.error('Mesh network error:', error);
          setMeshStatus('disconnected');
        };

        ws.onclose = () => {
          console.log('Mesh network disconnected');
          setMeshStatus('disconnected');
          clearInterval(heartbeatTimer);
          
          reconnectTimer = setTimeout(() => {
            if (!isOnline) {
              setMeshStatus('connecting');
              connect();
            }
          }, 5000);
        };
      } catch (error) {
        console.error('Failed to connect to mesh network:', error);
        setMeshStatus('disconnected');
        simulateMeshNetwork();
      }
    };

    const disconnect = () => {
      if (ws) {
        clearInterval(heartbeatTimer);
        clearTimeout(reconnectTimer);
        ws.close();
      }
    };

    return { connect, disconnect };
  }, [userLocation, isOnline]);

  const generatePeerId = () => {
    return 'peer_' + Math.random().toString(36).substr(2, 9);
  };

  const handleMeshMessage = (message) => {
    switch (message.type) {
      case 'peer_list':
        setMeshPeers(message.peers || []);
        break;
      case 'emergency_broadcast':
        setMeshMessages(prev => [...prev, message]);
        if (Notification.permission === 'granted') {
          new Notification('Emergency Alert via Mesh', {
            body: message.content,
            icon: '/emergency-icon.png'
          });
        }
        break;
      case 'resource_share':
        console.log('Resource shared:', message.resource);
        break;
      case 'location_update':
        setMeshPeers(prev => 
          prev.map(p => p.id === message.peerId ? { ...p, location: message.location } : p)
        );
        break;
      default:
        console.log('Unknown mesh message type:', message.type);
    }
  };

  const simulateMeshNetwork = () => {
    setMeshStatus('connected');
    const mockPeers = [
      { id: 'peer_1', name: 'Emergency Responder 1', distance: 0.5, type: 'responder' },
      { id: 'peer_2', name: 'Medical Team', distance: 1.2, type: 'medical' },
      { id: 'peer_3', name: 'Volunteer', distance: 0.8, type: 'volunteer' }
    ];
    setMeshPeers(mockPeers);
  };

  const broadcastEmergencyMesh = (message) => {
    if (meshNode && meshNode.connect) {
      const broadcast = {
        type: 'emergency_broadcast',
        content: message,
        location: userLocation,
        timestamp: Date.now(),
        sender: generatePeerId()
      };
      
      try {
        console.log('Broadcasting via mesh:', broadcast);
        setMeshMessages(prev => [...prev, broadcast]);
        return true;
      } catch (error) {
        console.error('Failed to broadcast on mesh:', error);
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setMeshStatus('disconnected');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setMeshStatus('connecting');
      const network = MeshNetworkManager();
      network.connect();
      setMeshNode(network);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (meshNode) {
        meshNode.disconnect();
      }
    };
  }, [MeshNetworkManager]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationPermission('granted');
        },
        (error) => {
          console.log('Location access denied, using default location');
          setLocationPermission('denied');
        }
      );
    }
  }, []);

  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationPermission('granted');
          setShowLocationDialog(false);
        },
        (error) => {
          console.log('Location access denied');
          setLocationPermission('denied');
          setShowLocationDialog(false);
        }
      );
    }
  };

  useEffect(() => {
    const fetchWeather = async () => {
      if (!WEATHER_API_KEY) {
        console.warn('⚠️ Weather API key not configured. Using mock data. Get your free key at https://www.weatherapi.com/');
        setWeather({
          temp: 28,
          condition: 'Partly Cloudy',
          humidity: 65,
          windSpeed: 12,
          feelsLike: 30
        });
        setWeatherAlerts([
          { 
            type: 'Heavy Rainfall', 
            severity: 'Moderate',
            category: 'Heavy rain',
            headline: 'Heavy rain expected',
            areas: 'Local area',
            effective: new Date().toISOString(),
            expires: new Date(Date.now() + 7200000).toISOString(),
            description: 'This is sample mock data. Add your WeatherAPI.com key to see real weather alerts.'
          }
        ]);
        return;
      }

      try {
        console.log('Fetching live weather data from WeatherAPI.com...');
        const weatherRes = await fetch(
          `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${userLocation.lat},${userLocation.lng}&days=1&aqi=no&alerts=yes`
        );
        const weatherData = await weatherRes.json();
        
        if (weatherData.error) {
          console.error('Weather API Error:', weatherData.error.message);
          throw new Error(weatherData.error.message);
        }
        
        console.log('✓ Live weather data loaded successfully');
        setWeather({
          temp: Math.round(weatherData.current.temp_c),
          condition: weatherData.current.condition.text,
          humidity: weatherData.current.humidity,
          windSpeed: Math.round(weatherData.current.wind_kph),
          feelsLike: Math.round(weatherData.current.feelslike_c)
        });

        if (weatherData.alerts && weatherData.alerts.alert && weatherData.alerts.alert.length > 0) {
          console.log('⚠️ Active weather alerts found:', weatherData.alerts.alert.length);
          setWeatherAlerts(weatherData.alerts.alert.map(alert => ({
            type: alert.event || 'Weather Alert',
            severity: alert.severity || 'Moderate',
            category: alert.category || 'General',
            headline: alert.headline || alert.event,
            areas: alert.areas || 'Local area',
            effective: alert.effective,
            expires: alert.expires,
            description: alert.desc || alert.instruction || 'Weather alert in effect.'
          })));
        } else {
          console.log('✓ No active weather alerts');
          setWeatherAlerts([]);
        }
      } catch (error) {
        console.error('Failed to fetch weather data:', error);
        console.error('API URL was:', `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${userLocation.lat},${userLocation.lng}&days=1&aqi=no&alerts=yes`);

        setWeather({
          temp: 28,
          condition: 'Data Unavailable',
          humidity: 65,
          windSpeed: 12,
          feelsLike: 30
        });
        setWeatherAlerts([]);
      }
    };

    if (isOnline) {
      fetchWeather();
      const interval = setInterval(fetchWeather, 300000); // Update every 5 minutes
      return () => clearInterval(interval);
    } else {
      setWeather({
        temp: 28,
        condition: 'Offline Mode',
        humidity: 65,
        windSpeed: 12,
        feelsLike: 30
      });
    }
  }, [userLocation, isOnline, WEATHER_API_KEY]);

  useEffect(() => {
    if (currentScreen === 'splash') {
      setTimeout(() => setCurrentScreen('home'), 2500);
    }
  }, [currentScreen]);

  const eventCodes = {
    action: [
      { code: 'V', subtype: 'Volunteer Needed', useCase: 'Immediate volunteer required' },
      { code: 'E', subtype: 'Equipment Needed', useCase: 'Will call you later' },
      { code: 'S', subtype: 'Specialized Help Needed', useCase: 'Expert Response like Medic etc.' },
      { code: 'R', subtype: 'Responders Needed', useCase: 'Police, Fire or Official Responders' }
    ],
    resource: [
      { code: 'M', subtype: 'Medical Needed', useCase: 'Standard Hospital or clinic' },
      { code: 'T', subtype: 'Transport Needed', useCase: 'Ambulance, Evacuation' },
      { code: 'X', subtype: 'Extended Support', useCase: 'Backup team or Additional resources' },
      { code: 'F', subtype: 'Food/Water Needed', useCase: 'Food, Water or Basic Supplies' }
    ],
    medical: [
      { code: 'M1', resource: 'Basic Medical', description: 'First Aid Box or basic medical injury' },
      { code: 'M2', resource: 'Enhanced Medical', description: 'Includes defibrillator, stretcher, oxygen' },
      { code: 'M3', resource: 'Full Medical Cluster', description: 'Complete medical setup' }
    ],
    fire: [
      { code: 'F1', resource: 'Fire Extinguisher', description: 'Basic fire equipment' },
      { code: 'F2', resource: 'Hydrant Available', description: 'Includes hydrant and hoses' },
      { code: 'F3', resource: 'Full Fire Cluster', description: 'Complete fire response setup' }
    ],
    hospital: [
      { code: 'H1', resource: 'Standard Hospital', description: 'Full operational hospital' },
      { code: 'H2', resource: 'Emergency Ready', description: 'Critical care ready' },
      { code: 'H3', resource: 'Full Critical Care', description: 'Complete emergency facilities' }
    ],
    subtype: [
      { code: 'C', subtype: 'Cardiac', useCase: 'Heart related' },
      { code: 'A', subtype: 'Assault', useCase: 'Violence or Physical Assault' },
      { code: 'B', subtype: 'Blood Loss', useCase: 'Severe Bleeding' },
      { code: 'F', subtype: 'Fracture', useCase: 'Bone Fractures' },
      { code: 'U', subtype: 'Unconscious', useCase: 'Person Unconscious' },
      { code: 'I', subtype: 'Injury', useCase: 'Severe Injuries' }
    ]
  };

  const emergencyContacts = {
    medical: {
      title: 'Medical Emergency',
      icon: '🏥',
      color: 'bg-red-600',
      numbers: [
        { name: 'Emergency Ambulance', number: '108', description: 'Free ambulance service' },
        { name: 'National Emergency', number: '112', description: 'All emergency services' },
        { name: 'Private Ambulance', number: '102', description: 'Alternative ambulance' }
      ]
    },
    police: {
      title: 'Police/Crime',
      icon: '👮',
      color: 'bg-blue-600',
      numbers: [
        { name: 'Police Emergency', number: '100', description: 'Police control room' },
        { name: 'National Emergency', number: '112', description: 'All emergency services' },
        { name: 'Women Helpline', number: '1091', description: 'Women safety' }
      ]
    },
    fire: {
      title: 'Fire Emergency',
      icon: '🔥',
      color: 'bg-orange-600',
      numbers: [
        { name: 'Fire Service', number: '101', description: 'Fire department' },
        { name: 'National Emergency', number: '112', description: 'All emergency services' }
      ]
    },
    accident: {
      title: 'Road Accident',
      icon: '🚗',
      color: 'bg-yellow-600',
      numbers: [
        { name: 'National Emergency', number: '112', description: 'All emergency services' },
        { name: 'Ambulance', number: '108', description: 'Medical assistance' },
        { name: 'Police', number: '100', description: 'Traffic police' }
      ]
    },
    disaster: {
      title: 'Natural Disaster',
      icon: '🌊',
      color: 'bg-purple-600',
      numbers: [
        { name: 'National Emergency', number: '112', description: 'All emergency services' },
        { name: 'Disaster Helpline', number: '1078', description: 'Disaster management' },
        { name: 'NDRF', number: '011-24363260', description: 'National disaster response' }
      ]
    },
    earthquake: {
      title: 'Earthquake',
      icon: '🏔️',
      color: 'bg-red-700',
      numbers: [
        { name: 'National Emergency', number: '112', description: 'All emergency services' },
        { name: 'Disaster Helpline', number: '1078', description: 'Disaster management' },
        { name: 'NDRF', number: '011-24363260', description: 'Rescue operations' }
      ]
    },
    flood: {
      title: 'Flood Emergency',
      icon: '🌊',
      color: 'bg-blue-700',
      numbers: [
        { name: 'National Emergency', number: '112', description: 'All emergency services' },
        { name: 'Flood Control', number: '1070', description: 'Flood control room' },
        { name: 'NDRF', number: '011-24363260', description: 'Rescue operations' }
      ]
    },
    mental: {
      title: 'Mental Health Crisis',
      icon: '🧠',
      color: 'bg-teal-600',
      numbers: [
        { name: 'Mental Health Helpline', number: '08046110007', description: 'Vandrevala Foundation' },
        { name: 'iCall', number: '9152987821', description: 'TISS counseling' },
        { name: 'NIMHANS', number: '080-46110007', description: 'Mental health support' }
      ]
    }
  };

  const startEmergencyTimer = (serviceName, number) => {
    const timerConfig = {
      '108': { duration: 5, service: 'Ambulance', icon: '🚑' },
      '100': { duration: 3, service: 'Police', icon: '🚓' },
      '101': { duration: 4, service: 'Fire Service', icon: '🚒' },
      '112': { duration: 4, service: 'Emergency Services', icon: '🚨' }
    };
    
    const config = timerConfig[number] || { duration: 5, service: serviceName, icon: '🚨' };
    const timerId = `timer_${Date.now()}`;
    const arrivalTime = new Date(Date.now() + config.duration * 60000);
    
    setEmergencyTimers(prev => ({
      ...prev,
      [timerId]: {
        service: config.service,
        icon: config.icon,
        startTime: new Date(),
        arrivalTime: arrivalTime,
        duration: config.duration,
        status: 'En Route',
        number: number
      }
    }));
    
    // Simulate arrival after timer expires
    setTimeout(() => {
      setEmergencyUpdates(prev => [{
        id: timerId,
        service: config.service,
        icon: config.icon,
        message: `${config.service} has arrived at your location`,
        time: new Date()
      }, ...prev]);
      
      setEmergencyTimers(prev => {
        const updated = { ...prev };
        if (updated[timerId]) {
          updated[timerId].status = 'Arrived';
        }
        return updated;
      });
    }, config.duration * 60000);
    
    return timerId;
  };

  const makeEmergencyCall = (number) => {
    const serviceMap = {
      '108': 'Ambulance',
      '100': 'Police',
      '101': 'Fire Service',
      '112': 'Emergency Services'
    };
    
    const serviceName = serviceMap[number] || 'Emergency Service';
    startEmergencyTimer(serviceName, number);
    window.location.href = `tel:${number}`;
  };

  const events = [
    { id: 1, type: 'CVX - Cardiac Event', time: '2:00 - 3:00 PM', location: 'Greater Kailash, New Delhi', color: '#DC2626', lat: 28.5494, lng: 77.2381 },
    { id: 2, type: 'MVA - Motor Vehicle Accident', time: '1:30 - 2:30 PM', location: 'MG Road, Bangalore', color: '#EA580C', lat: 12.9756, lng: 77.6069 },
    { id: 3, type: 'Fall Injury', time: '1:00 - 2:00 PM', location: 'Andheri West, Mumbai', color: '#F59E0B', lat: 19.1136, lng: 72.8697 },
    { id: 4, type: 'Respiratory Distress', time: '12:15 PM', location: 'Park Street, Kolkata', color: '#0891B2', lat: 22.5544, lng: 88.3516 },
    { id: 5, type: 'Stroke - CVA', time: '11:45 AM', location: 'Jubilee Hills, Hyderabad', color: '#DC2626', lat: 17.4305, lng: 78.4078 }
  ];

  const nearbyResources = [
    { id: 1, name: 'Apollo Hospital', distance: 1.2, type: 'hospital', lat: userLocation.lat + 0.01, lng: userLocation.lng + 0.01, status: 'Available' },
    { id: 2, name: 'Police Station', distance: 0.8, type: 'police', lat: userLocation.lat - 0.008, lng: userLocation.lng + 0.008, status: 'Available' },
    { id: 3, name: 'First Aid Center', distance: 0.3, type: 'firstaid', lat: userLocation.lat + 0.003, lng: userLocation.lng - 0.003, status: 'Available' },
    { id: 4, name: 'Ambulance Service', distance: 2.1, type: 'ambulance', lat: userLocation.lat + 0.02, lng: userLocation.lng - 0.015, status: 'En-route' }
  ];

  const activities = [
    { id: 1, type: 'CVX', desc: 'Kannankudy Block, Varkala Jamath, Masjid...', time: 'Attended at 2:22 PM', date: '12.08.2024' },
    { id: 2, type: 'MVA', desc: 'Miyakanda Road, Rasool Pallikat, 4...Media', time: 'Attended at 1:30 PM', date: '10.08.2024' }
  ];

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  if (currentScreen === 'splash') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-gray-700 to-gray-800 rounded-3xl flex items-center justify-center">
            <div className="text-center">
              <Heart className="w-12 h-12 text-red-500 mx-auto mb-2 animate-pulse" strokeWidth={2.5} />
              <div className="text-cyan-400 text-xs font-bold">REACH</div>
            </div>
          </div>
          <h1 className="text-white text-3xl font-bold mb-2">R.E.A.C.H</h1>
          <p className="text-gray-400 text-sm italic px-8">
            Rapid Emergency<br />Access, Care, and Help<br />Anytime, Anywhere.
          </p>
        </div>
      </div>
    );
  }

  if (currentScreen === 'home') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white px-4 py-3 flex items-center justify-between border-b">
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
            <span className="text-[10px] text-gray-500">{currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <span className="text-xs text-gray-500">Emergency Services</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowLocationDialog(true)}
              className="relative"
            >
              <MapPin className={`w-4 h-4 ${locationPermission === 'granted' ? 'text-green-500' : locationPermission === 'denied' ? 'text-red-500' : 'text-gray-400'}`} />
            </button>
            
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : meshStatus === 'connected' ? (
              <Radio className="w-4 h-4 text-blue-500 animate-pulse" title="Mesh Network Active" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <div className="w-4 h-3 border border-black rounded-sm"></div>
          </div>
        </div>

        {showLocationDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-blue-500" />
                <h3 className="text-lg font-bold">Location Access</h3>
              </div>
              
              {locationPermission === 'granted' ? (
                <div>
                  <p className="text-sm text-gray-600 mb-4">✓ Location access enabled</p>
                  <div className="bg-green-50 p-3 rounded-lg mb-4">
                    <p className="text-xs text-green-800 font-medium">📍 Current Location:</p>
                    <p className="text-sm text-green-900 mt-1">Latitude: {userLocation.lat.toFixed(6)}</p>
                    <p className="text-sm text-green-900">Longitude: {userLocation.lng.toFixed(6)}</p>
                  </div>
                  <p className="text-xs text-gray-500">Your location helps emergency services reach you faster.</p>
                </div>
              ) : locationPermission === 'denied' ? (
                <div>
                  <p className="text-sm text-gray-600 mb-4">⚠️ Location access denied</p>
                  <div className="bg-red-50 p-3 rounded-lg mb-4 border border-red-200">
                    <p className="text-xs text-red-800 font-medium">Using default location</p>
                    <p className="text-xs text-red-700 mt-1">Enable location in browser settings for accurate emergency response</p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-4">Allow R.E.A.C.H to access your location for accurate emergency services.</p>
                  <button 
                    onClick={requestLocationPermission}
                    className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium mb-2 hover:bg-blue-600"
                  >
                    Grant Permission
                  </button>
                </div>
              )}
              
      <button
              onClick={ () => setShowLocationDialog(false) }
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {!isOnline && meshStatus === 'connected' && (
          <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-medium">Mesh Network Active</span>
            </div>
            <button 
              onClick={() => setCurrentScreen('meshNetwork')}
              className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded"
            >
              {meshPeers.length} Peers
            </button>
          </div>
        )}

        {weather && weatherAlerts.length > 0 && (
          <div onClick={() => setCurrentScreen('weatherAlert')} className="bg-red-600 text-white px-4 py-3 cursor-pointer hover:bg-red-700 transition-colors">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Weather Alert: {weatherAlerts[0].type}</p>
                <p className="text-xs opacity-90">Severity: {weatherAlerts[0].severity}</p>
              </div>
              <button className="bg-white text-red-600 px-3 py-1 rounded text-xs font-medium">View Details</button>
            </div>
          </div>
        )}

        {weather && (
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs opacity-75">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-xs opacity-75">
                Updated: {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5" />
                  <span className="text-3xl font-bold">{weather.temp}°C</span>
                </div>
                <p className="text-sm opacity-90 mt-1">{weather.condition}</p>
                <p className="text-xs opacity-75">Feels like {weather.feelsLike}°C</p>
              </div>
              <div className="text-right text-sm">
                <div className="flex items-center gap-1 justify-end mb-1">
                  <Wind className="w-4 h-4" />
                  <span>{weather.windSpeed} km/h</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <CloudRain className="w-4 h-4" />
                  <span>{weather.humidity}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Emergency Response Timers */}
        {Object.entries(emergencyTimers).length > 0 && (
          <div className="mx-4 mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl p-4 shadow-lg">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 animate-pulse" />
              Active Emergency Response
            </h3>
            <div className="space-y-3">
              {Object.entries(emergencyTimers).map(([id, timer]) => {
                const timeLeft = Math.max(0, Math.floor((timer.arrivalTime - currentTime) / 1000));
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                
                return (
                  <div key={id} className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{timer.icon}</span>
                        <span className="font-bold">{timer.service}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        timer.status === 'Arrived' 
                          ? 'bg-green-500' 
                          : 'bg-yellow-500 text-black animate-pulse'
                      }`}>
                        {timer.status}
                      </span>
                    </div>
                    
                    {timer.status === 'En Route' && timeLeft > 0 ? (
                      <div className="bg-black bg-opacity-30 rounded-lg p-3 mb-2">
                        <div className="flex items-baseline gap-2">
                          <div className="text-4xl font-bold tabular-nums">
                            {minutes}:{seconds.toString().padStart(2, '0')}
                          </div>
                          <span className="text-sm opacity-90">min remaining</span>
                        </div>
                        <div className="w-full bg-white bg-opacity-30 rounded-full h-2 mt-2">
                          <div 
                            className="bg-white h-2 rounded-full transition-all duration-1000"
                            style={{ 
                              width: `${((timer.duration * 60 - timeLeft) / (timer.duration * 60)) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    ) : timer.status === 'Arrived' ? (
                      <div className="bg-green-500 bg-opacity-30 rounded-lg p-3 mb-2">
                        <p className="font-medium">✓ Service has arrived at location</p>
                      </div>
                    ) : null}
                    
                    <p className="text-xs opacity-75">
                      Called at {timer.startTime.toLocaleTimeString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Emergency Updates */}
        {emergencyUpdates.length > 0 && (
          <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              Recent Updates
            </h3>
            <div className="space-y-2">
              {emergencyUpdates.slice(0, 3).map(update => (
                <div key={update.id} className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{update.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900">{update.message}</p>
                      <p className="text-xs text-green-700 mt-1">{update.time.toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 space-y-4 pb-24">
          <button onClick={() => document.getElementById('mediaInput').click()} className="w-full bg-gray-900 text-white rounded-2xl p-4 flex items-center justify-between hover:bg-gray-800 transition-colors">
            <div className="flex items-center gap-3">
              <Image className="w-5 h-5" />
              <span className="font-medium">Add media</span>
            </div>
          </button>
          <input id="mediaInput" type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => {
            const files = Array.from(e.target.files);
            setMediaFiles(prev => [...prev, ...files]);
            alert(`${files.length} file(s) added successfully!`);
          }} />

          <button onClick={() => setCurrentScreen('requestForm')} className="w-full bg-gray-900 text-white rounded-2xl p-4 flex items-center justify-between hover:bg-gray-800 transition-colors">
            <div className="flex items-center gap-3">
              <Edit className="w-5 h-5" />
              <span className="font-medium">Request Resources</span>
            </div>
          </button>

          <button onClick={() => setShowEmergencyCallMenu(true)} className="w-full bg-gray-900 text-white rounded-2xl p-4 flex items-center justify-between hover:bg-gray-800 transition-colors">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5" />
              <span className="font-medium">Emergency Call</span>
            </div>
          </button>

          {showEmergencyCallMenu && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
              <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-4 py-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Select Emergency Type</h3>
                  <button onClick={() => setShowEmergencyCallMenu(false)} className="text-gray-500 text-2xl">×</button>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {Object.entries(emergencyContacts).map(([key, emergency]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedEmergencyType(key);
                        setShowEmergencyCallMenu(false);
                        setCurrentScreen('emergencyNumbers');
                      }}
                      className={`${emergency.color} text-white rounded-2xl p-4 text-center hover:opacity-90 transition-opacity`}
                    >
                      <div className="text-3xl mb-2">{emergency.icon}</div>
                      <p className="font-semibold text-sm">{emergency.title}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button className="w-full bg-green-600 text-white rounded-2xl p-4 flex items-center justify-between hover:bg-green-700 transition-colors">
            <div className="flex items-center gap-3">
              <Video className="w-5 h-5" />
              <span className="font-medium">Video Call</span>
            </div>
          </button>

          {mediaFiles.length > 0 && (
            <div className="bg-white rounded-2xl p-4">
              <h3 className="font-semibold mb-2">Uploaded Media ({mediaFiles.length})</h3>
              <div className="grid grid-cols-3 gap-2">
                {mediaFiles.map((file, idx) => (
                  <div key={idx} className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                    <Camera className="w-6 h-6 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <BottomNav currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'emergencyNumbers' && selectedEmergencyType) {
    const emergency = emergencyContacts[selectedEmergencyType];
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title={emergency.title} onBack={() => setCurrentScreen('home')} />
        <div className="p-4 pb-24">
          <div className={`${emergency.color} text-white rounded-2xl p-6 mb-4 text-center`}>
            <div className="text-5xl mb-3">{emergency.icon}</div>
            <h2 className="text-2xl font-bold">{emergency.title}</h2>
            <p className="text-sm opacity-90 mt-2">Tap any number to call immediately</p>
          </div>

          <div className="space-y-3">
            {emergency.numbers.map((contact, idx) => (
              <button
                key={idx}
                onClick={() => makeEmergencyCall(contact.number)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left flex-1">
                    <h3 className="font-bold text-lg">{contact.name}</h3>
                    <p className="text-sm text-gray-600">{contact.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-blue-600">{contact.number}</span>
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <h3 className="font-bold text-yellow-900 mb-2">⚠️ Important</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Stay calm and speak clearly</li>
              <li>• Provide your exact location</li>
              <li>• Describe the emergency situation</li>
              <li>• Follow dispatcher instructions</li>
            </ul>
          </div>
        </div>
        <BottomNav currentScreen="home" setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'weatherAlert') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Weather Alert" onBack={() => setCurrentScreen('home')} />
        <div className="relative pb-24">
          <div className="h-96 relative">
            <MapContainer 
              center={[userLocation.lat, userLocation.lng]} 
              zoom={8} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              <Marker position={[userLocation.lat, userLocation.lng]} icon={createCustomIcon('#3B82F6')}>
                <Popup>Your Location</Popup>
              </Marker>
              <Circle center={[userLocation.lat, userLocation.lng]} radius={10000} color="#DC2626" fillOpacity={0.1} />
            </MapContainer>
            <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-lg z-[1000]">
              <p className="text-xs font-semibold text-red-600">⚠️ Active Weather Alert</p>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {weatherAlerts.length > 0 ? (
              weatherAlerts.map((alert, idx) => (
                <div key={idx} className="bg-red-600 text-white rounded-2xl p-4 shadow-lg">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="w-6 h-6 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-lg">{alert.headline || alert.type}</p>
                      <p className="text-sm mt-1 opacity-90">Category: {alert.category}</p>
                      <p className="text-sm opacity-90">Severity: {alert.severity}</p>
                    </div>
                  </div>
                  
                  {alert.description && (
                    <div className="bg-white bg-opacity-20 rounded-lg p-3 mb-3">
                      <p className="text-sm">{alert.description}</p>
                    </div>
                  )}
                  
                  {alert.areas && (
                    <p className="text-xs opacity-75 mb-1">📍 Affected Areas: {alert.areas}</p>
                  )}
                  
                  <div className="flex justify-between text-xs opacity-75 mt-2">
                    {alert.effective && (
                      <span>From: {new Date(alert.effective).toLocaleString()}</span>
                    )}
                    {alert.expires && (
                      <span>Until: {new Date(alert.expires).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                <p className="text-green-800 font-medium">✓ No active weather alerts</p>
                <p className="text-sm text-green-600 mt-1">Weather conditions are currently normal</p>
              </div>
            )}

            {weather && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-blue-500" />
                  Current Conditions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Thermometer className="w-5 h-5 text-blue-600 mb-1" />
                    <p className="text-xs text-gray-600">Temperature</p>
                    <p className="text-xl font-bold text-blue-900">{weather.temp}°C</p>
                    <p className="text-xs text-gray-500">Feels like {weather.feelsLike}°C</p>
                  </div>
                  <div className="bg-cyan-50 p-3 rounded-lg">
                    <Wind className="w-5 h-5 text-cyan-600 mb-1" />
                    <p className="text-xs text-gray-600">Wind Speed</p>
                    <p className="text-xl font-bold text-cyan-900">{weather.windSpeed} km/h</p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <CloudRain className="w-5 h-5 text-indigo-600 mb-1" />
                    <p className="text-xs text-gray-600">Humidity</p>
                    <p className="text-xl font-bold text-indigo-900">{weather.humidity}%</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <Cloud className="w-5 h-5 text-purple-600 mb-1" />
                    <p className="text-xs text-gray-600">Condition</p>
                    <p className="text-base font-bold text-purple-900">{weather.condition}</p>
                  </div>
                </div>
              </div>
            )}

            {weatherAlerts.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <h3 className="font-bold mb-2 text-yellow-900">⚠️ Safety Tips</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Stay indoors if possible</li>
                  <li>• Keep emergency contacts ready</li>
                  <li>• Monitor weather updates regularly</li>
                  <li>• Avoid travel unless necessary</li>
                </ul>
              </div>
            )}
          </div>
        </div>
        <BottomNav currentScreen="home" setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'requestForm') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Request Form" onBack={() => setCurrentScreen('home')} />
        <div className="p-4 space-y-4 pb-24">
          <div className="bg-white rounded-2xl p-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Name</label>
              <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter your name" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Location</label>
              <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter location" value={`${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`} readOnly />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Contact</label>
              <input type="tel" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter contact number" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Type</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Description</span>
                  <button className="text-gray-400">×</button>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-gray-300 text-gray-700 text-xs rounded mb-1">Medical</span>
                    <p className="text-sm">Description</p>
                  </div>
                  <button className="text-gray-400">×</button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">*Please provide details of assistance needed</p>
            </div>
            <button className="w-full bg-gray-900 text-white rounded-lg py-3 font-semibold hover:bg-gray-800">Request</button>
          </div>
        </div>
        <BottomNav currentScreen="home" setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'navigation') {
    const destination = nearbyResources[0];
    const routePath = [
      [userLocation.lat, userLocation.lng],
      [userLocation.lat + 0.003, userLocation.lng + 0.005],
      [userLocation.lat + 0.007, userLocation.lng + 0.009],
      [destination.lat, destination.lng]
    ];
    
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="" onBack={() => setCurrentScreen('map')} />
        <div className="relative h-screen pb-24">
          <div className="h-full">
            <MapContainer 
              center={[userLocation.lat + 0.005, userLocation.lng + 0.005]} 
              zoom={14} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[userLocation.lat, userLocation.lng]} icon={createCustomIcon('#3B82F6')}>
                <Popup>Your Location</Popup>
              </Marker>
              <Marker position={[destination.lat, destination.lng]} icon={createCustomIcon('#9333EA')}>
                <Popup>{destination.name}</Popup>
              </Marker>
              <Polyline positions={routePath} color="#FF6B35" weight={4} />
            </MapContainer>
          </div>
          <div className="absolute top-4 left-4 right-4 bg-white rounded-2xl p-4 shadow-lg z-[1000]">
            <div className="flex items-center justify-between">
              <button className="p-2" onClick={() => setCurrentScreen('map')}><ChevronRight className="w-5 h-5 rotate-180" /></button>
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-orange-500">ETA - {Math.round(destination.distance * 5)} min</p>
                <p className="text-xs text-gray-500">{destination.distance} km via Main Route</p>
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <Navigation className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 bg-green-50 rounded-lg px-3 py-2 flex items-center justify-center gap-2">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">En Route to {destination.name}</span>
            </div>
          </div>
        </div>
        <BottomNav currentScreen="map" setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'activityHistory') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Activity History" onBack={() => setCurrentScreen('profile')} />
        <div className="p-4">
          <div className="mb-4">
            <div className="relative">
              <input type="text" placeholder="Search" className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-lg" />
              <div className="absolute left-3 top-2.5 text-gray-400">🔍</div>
            </div>
          </div>
          <div className="space-y-3 pb-24">
            {activities.map(activity => (
              <div key={activity.id} className="bg-red-500 text-white rounded-2xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{activity.type}</h3>
                  <span className="bg-blue-500 px-3 py-1 rounded-full text-xs">See more</span>
                </div>
                <p className="text-sm opacity-90 mb-2">{activity.desc}</p>
                <div className="flex justify-between items-center text-xs">
                  <span>{activity.time}</span>
                  <span>{activity.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <BottomNav currentScreen="profile" setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'eventCodes') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Event Codes" onBack={() => setCurrentScreen('profile')} />
        <div className="p-4 pb-24">
          <div className="mb-4">
            <div className="relative">
              <input type="text" placeholder="Search" className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-lg" />
              <div className="absolute left-3 top-2.5 text-gray-400">🔍</div>
            </div>
          </div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {['action', 'resource', 'medical', 'fire', 'hospital', 'subtype'].map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${selectedCategory === cat ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {eventCodes[selectedCategory].map((item, idx) => (
                  <tr key={idx} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-sm font-medium">{item.code}</td>
                    <td className="px-4 py-3 text-sm">{item.subtype || item.resource}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.useCase || item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <BottomNav currentScreen="profile" setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'events') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Active Events" />
        <div className="h-64">
          <MapContainer 
            center={[userLocation.lat, userLocation.lng]} 
            zoom={6} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={createCustomIcon('#3B82F6')}>
              <Popup>Your Location</Popup>
            </Marker>
            {events.map(event => (
              <Marker 
                key={event.id} 
                position={[event.lat, event.lng]} 
                icon={createCustomIcon(event.color)}
                eventHandlers={{
                  click: () => {
                    setSelectedEvent(event);
                    setCurrentScreen('eventDetail');
                  }
                }}
              >
                <Popup>
                  <strong>{event.type}</strong><br />
                  {event.location}<br />
                  {event.time}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <div className="p-4 space-y-3 pb-24">
          <h3 className="font-bold text-lg">All Active Events</h3>
          {events.map(event => (
            <div key={event.id} onClick={() => { setSelectedEvent(event); setCurrentScreen('eventDetail'); }} className="rounded-2xl p-4 text-white cursor-pointer hover:opacity-90 transition-opacity" style={{ backgroundColor: event.color }}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{event.type}</h3>
                <button className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs">View Details</button>
              </div>
              <p className="text-sm opacity-90 mb-1">{event.time}</p>
              <p className="text-sm opacity-90 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.location}
              </p>
              <p className="text-xs opacity-75 mt-1">
                {calculateDistance(userLocation.lat, userLocation.lng, event.lat, event.lng)} km away
              </p>
            </div>
          ))}
        </div>
        <BottomNav currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'eventDetail' && selectedEvent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Event Details" onBack={() => setCurrentScreen('events')} />
        <div className="h-64">
          <MapContainer 
            center={[selectedEvent.lat, selectedEvent.lng]} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={createCustomIcon('#3B82F6')}>
              <Popup>Your Location</Popup>
            </Marker>
            <Marker position={[selectedEvent.lat, selectedEvent.lng]} icon={createCustomIcon(selectedEvent.color)}>
              <Popup>{selectedEvent.type}</Popup>
            </Marker>
            <Polyline 
              positions={[
                [userLocation.lat, userLocation.lng],
                [selectedEvent.lat, selectedEvent.lng]
              ]} 
              color="#6366F1" 
              dashArray="10, 10"
            />
          </MapContainer>
        </div>
        <div className="p-4 space-y-4 pb-24">
          <div className="bg-red-600 text-white rounded-2xl p-4">
            <h2 className="font-bold text-xl mb-2">{selectedEvent.type}</h2>
            <p className="text-sm mb-1">Start Time: {selectedEvent.time.split(' - ')[0]}</p>
            <p className="text-sm mb-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {selectedEvent.location}
            </p>
            <p className="text-sm mb-3">
              Distance: {calculateDistance(userLocation.lat, userLocation.lng, selectedEvent.lat, selectedEvent.lng)} km away
            </p>
            <div className="flex gap-2">
              <button className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium flex-1">I am responding</button>
              <button 
                className="bg-white bg-opacity-20 p-2 rounded-lg"
                onClick={() => {
                  setCurrentScreen('navigation');
                }}
              >
                <Navigation className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">Updates</h3>
              <button className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm">See more</button>
            </div>
            <div className="space-y-2">
              {['Volunteer Arrived at Scene', 'ETA confirmed for Ambulance', 'Paramedic en route'].map((update, idx) => (
                <div key={idx} className="bg-red-50 rounded-lg p-3 text-sm">
                  <p className="text-red-800">{update}</p>
                  <p className="text-gray-500 text-xs mt-1">{5 + idx * 3} mins ago</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <BottomNav currentScreen="events" setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'map') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Nearby Resources" />
        <div className="h-96">
          <MapContainer 
            center={[userLocation.lat, userLocation.lng]} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={createCustomIcon('#3B82F6')}>
              <Popup>Your Location</Popup>
            </Marker>
            {nearbyResources.map(resource => (
              <Marker 
                key={resource.id} 
                position={[resource.lat, resource.lng]} 
                icon={createCustomIcon(
                  resource.type === 'hospital' ? '#DC2626' :
                  resource.type === 'police' ? '#2563EB' :
                  resource.type === 'ambulance' ? '#16A34A' :
                  '#F59E0B'
                )}
              >
                <Popup>
                  <strong>{resource.name}</strong><br />
                  {resource.distance} km away<br />
                  Status: {resource.status}
                </Popup>
              </Marker>
            ))}
            <Circle center={[userLocation.lat, userLocation.lng]} radius={2000} color="#3B82F6" fillOpacity={0.05} />
          </MapContainer>
        </div>
        <div className="p-4 space-y-3 pb-24">
          <h3 className="font-bold text-lg">Nearby Emergency Resources</h3>
          {nearbyResources.map(resource => (
            <div key={resource.id} className="bg-white rounded-xl p-4 flex justify-between items-center shadow-sm">
              <div className="flex-1">
                <h4 className="font-semibold">{resource.name}</h4>
                <p className="text-sm text-gray-500">{resource.distance} km away</p>
                {resource.status && (
                  <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                    resource.status === 'En-route' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {resource.status}
                  </span>
                )}
              </div>
              <button 
                onClick={() => setCurrentScreen('navigation')} 
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors ml-3"
              >
                <Navigation className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
        <BottomNav currentScreen="map" setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'feedback') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Feedback & Community" onBack={() => setCurrentScreen('profile')} />
        <div className="p-4 pb-24">
          <div className="bg-white rounded-2xl p-6 mb-4">
            <h2 className="text-xl font-bold mb-4">Share Your Feedback</h2>
            <p className="text-sm text-gray-600 mb-6">Help us improve R.E.A.C.H by sharing your experience</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Your Name</label>
                <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter your name" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input type="email" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter your email" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Feedback Type</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                  <option>Bug Report</option>
                  <option>Feature Request</option>
                  <option>General Feedback</option>
                  <option>Appreciation</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Your Message</label>
                <textarea 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" 
                  rows="5" 
                  placeholder="Tell us what you think..."
                ></textarea>
              </div>
              
              <button className="w-full bg-blue-500 text-white rounded-lg py-3 font-semibold hover:bg-blue-600">
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
        <BottomNav currentScreen="profile" setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'notifications') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Notification Settings" onBack={() => setCurrentScreen('profile')} />
        <div className="p-4 pb-24">
          <div className="bg-white rounded-2xl p-6 mb-4">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-blue-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Enable Notifications</h2>
              <p className="text-sm text-gray-600">Stay informed about emergency alerts and updates</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="text-green-600 text-xl">✓</div>
                <div>
                  <p className="font-medium text-green-900">Emergency Alerts</p>
                  <p className="text-xs text-green-700">Get notified about nearby emergencies</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="text-blue-600 text-xl">🔔</div>
                <div>
                  <p className="font-medium text-blue-900">Weather Warnings</p>
                  <p className="text-xs text-blue-700">Receive severe weather alerts</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="text-purple-600 text-xl">📍</div>
                <div>
                  <p className="font-medium text-purple-900">Location Updates</p>
                  <p className="text-xs text-purple-700">Updates when help is nearby</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => {
                if ('Notification' in window) {
                  Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      alert('Notifications enabled successfully!');
                    } else {
                      alert('Notification permission denied. Please enable in browser settings.');
                    }
                  });
                }
              }}
              className="w-full bg-blue-500 text-white rounded-lg py-3 font-semibold hover:bg-blue-600 mb-3"
            >
              Enable Notifications
            </button>
            
            <p className="text-xs text-center text-gray-500">
              Current Status: {Notification.permission === 'granted' ? '✓ Enabled' : 
                              Notification.permission === 'denied' ? '✗ Denied' : '⚠ Not Set'}
            </p>
          </div>
        </div>
        <BottomNav currentScreen="profile" setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'cpr') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="CPR for Adults" onBack={() => setCurrentScreen('profile')} />
        <div className="p-4 space-y-6 pb-24">
          <div className="bg-white rounded-2xl p-6">
            <h2 className="font-bold text-xl mb-4">CPR Instructions</h2>
            <div className="space-y-4">
              {[
                'CHECK the scene for safety and use PPE',
                'CHECK for responsiveness and breathing',
                'CALL 9-1-1 and get equipment',
                'Place person on back on firm surface',
                'Deliver chest compressions at 100-120/min',
                'Open airway, pinch nose, give rescue breaths'
              ].map((text, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">{i + 1}</div>
                  <p className="text-gray-700 pt-1">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6">
            <h3 className="font-semibold mb-3">Hand Position</h3>
            <div className="bg-blue-50 rounded-xl h-48 flex items-center justify-center">
              <p className="text-gray-500">CPR Illustration</p>
            </div>
            <p className="text-sm text-gray-600 mt-3">Body position: Shoulders over hands, elbows locked. Rate: 100-120/min. Depth: At least 2 inches.</p>
          </div>
        </div>
        <BottomNav currentScreen="profile" setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'profile') {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header title="" />
        <div className="p-4 pb-24">
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3 px-2">User</h3>
            <div className="bg-white rounded-2xl overflow-hidden">
              {[
                { label: 'Activity History', screen: 'activityHistory' },
                { label: 'Event Codes', screen: 'eventCodes' },
                { label: 'Feedback', screen: 'feedback' },
              ].map((item, i) => (
                <button key={i} onClick={() => item.screen && setCurrentScreen(item.screen)} className="w-full px-4 py-4 flex justify-between items-center border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                  <span className="text-gray-700">{item.label}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3 px-2">Settings</h3>
            <div className="bg-white rounded-2xl overflow-hidden">
              {[
                { label: 'Notification', screen: 'notifications' },
                { label: 'Account Management', screen: null },
                { label: 'Legal and Policies', screen: null }
              ].map((item, i) => (
                <button key={i} onClick={() => item.screen && setCurrentScreen(item.screen)} className="w-full px-4 py-4 flex justify-between items-center border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                  <span className="text-gray-700">{item.label}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setCurrentScreen('cpr')} className="w-full bg-red-500 text-white rounded-2xl py-4 font-semibold hover:bg-red-600 transition-colors">
            View Emergency Procedures
          </button>
        </div>
        <BottomNav currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  return null;
};

const Header = ({ title, onBack }) => (
  <div className="bg-white px-4 py-3 border-b sticky top-0 z-10">
    <div className="flex items-center justify-between">
      {onBack ? <button onClick={onBack} className="text-blue-500">← Back</button> : <span className="text-sm">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>}
      <span className="font-semibold">{title}</span>
      <div className="w-12"></div>
    </div>
  </div>
);

const BottomNav = ({ currentScreen, setCurrentScreen }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-3 flex justify-between items-center z-10">
    <button onClick={() => setCurrentScreen('home')} className={`flex flex-col items-center ${currentScreen === 'home' ? 'text-blue-500' : 'text-gray-400'}`}>
      <Home className="w-6 h-6" />
    </button>
    <button onClick={() => setCurrentScreen('events')} className={`flex flex-col items-center ${currentScreen === 'events' || currentScreen === 'eventDetail' ? 'text-blue-500' : 'text-gray-400'}`}>
      <AlertCircle className="w-6 h-6" />
    </button>
    <button onClick={() => setCurrentScreen('map')} className={`flex flex-col items-center ${currentScreen === 'map' || currentScreen === 'navigation' ? 'text-blue-500' : 'text-gray-400'}`}>
      <Menu className="w-6 h-6" />
    </button>
    <button onClick={() => setCurrentScreen('profile')} className={`flex flex-col items-center ${currentScreen === 'profile' || currentScreen === 'cpr' || currentScreen === 'activityHistory' || currentScreen === 'eventCodes' || currentScreen === 'feedback' || currentScreen === 'notifications' ? 'text-blue-500' : 'text-gray-400'}`}>
      <User className="w-6 h-6" />
    </button>
  </div>
);

export default App;
