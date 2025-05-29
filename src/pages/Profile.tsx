import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, uploadAvatar, deleteAvatar } from '../lib/supabase';
import { AlertCircle, Upload, User, Camera, Mail, Phone, MapPin, Calendar, Shield, Bell } from 'lucide-react';

export function Profile() {
  const { session, profile, updateProfile, fetchProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false,
    priceAlerts: true,
    weatherAlerts: true,
    governmentUpdates: true,
    marketInsights: true
  });

  useEffect(() => {
    async function fetchData() {
      if (session?.user) {
        try {
          await fetchProfile();
        } catch (error) {
          console.error('Error fetching profile:', error);
          setError('Error fetching profile');
        }
      }
    }
    fetchData();
  }, [session]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhoneNumber(profile.phone_number || '');
      setLocation(profile.location || '');
      
      if (profile.avatar_url) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(profile.avatar_url);
        setAvatarUrl(data.publicUrl);
      }
    }
  }, [profile]);

  async function handleUpdateProfile() {
    try {
      setLoading(true);
      setError(null);
      
      if (!session?.user) {
        throw new Error('No user logged in');
      }

      await updateProfile({
        full_name: fullName,
        phone_number: phoneNumber,
        location: location,
      });

      alert('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setError(null);
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      if (!session?.user?.id) {
        throw new Error('No user logged in');
      }

      const file = event.target.files[0];
      
      // Delete existing avatar if there is one
      if (profile?.avatar_url) {
        await deleteAvatar(session.user.id, profile.avatar_url);
      }

      // Upload new avatar
      const fileName = await uploadAvatar(session.user.id, file);
      
      // Update profile with new avatar URL
      await updateProfile({ avatar_url: fileName });

      // Update local avatar URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl);

    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(err instanceof Error ? err.message : 'Error uploading avatar');
    } finally {
      setUploading(false);
    }
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-theme-primary h-32 relative">
            <div className="absolute -bottom-16 left-8">
              <div className="w-32 h-32 rounded-full bg-white p-1 shadow-lg">
                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center overflow-hidden relative group">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={64} className="text-gray-400" />
                  )}
                  <label className="absolute bottom-0 right-0 bg-theme-primary text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-opacity-90 transition-colors">
                    <Camera size={16} />
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                  </label>
                  {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-20 px-8 pb-6">
            <h1 className="text-2xl font-bold text-gray-900">{fullName || 'Your Name'}</h1>
            <p className="text-gray-600">{session?.user?.email}</p>
            {uploading && <p className="text-sm text-theme-primary mt-2">Uploading image...</p>}
          </div>
          
          {/* Tabs */}
          <div className="border-b">
            <nav className="flex px-8 -mb-px">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'profile'
                    ? 'border-theme-primary text-theme-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'notifications'
                    ? 'border-theme-primary text-theme-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Notification Settings
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'security'
                    ? 'border-theme-primary text-theme-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Security
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 p-4 rounded-md flex items-center text-red-800">
                <AlertCircle className="mr-2" size={20} />
                {error}
              </div>
            )}
            
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="fullName"
                        className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-theme-primary focus:border-theme-primary sm:text-sm"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        disabled
                        className="pl-10 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
                        value={session?.user?.email || ''}
                      />
                    </div>
                  </div>
                  
                  {/* Phone Number */}
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        id="phoneNumber"
                        className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-theme-primary focus:border-theme-primary sm:text-sm"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Location */}
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="location"
                        className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-theme-primary focus:border-theme-primary sm:text-sm"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="bg-theme-primary text-white py-2 px-4 rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-primary disabled:opacity-70"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Notification Channels</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Mail size={18} className="text-gray-500 mr-3" />
                        <span>Email Notifications</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={notificationSettings.email}
                          onChange={() => setNotificationSettings({
                            ...notificationSettings,
                            email: !notificationSettings.email
                          })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-theme-primary peer-focus:ring-opacity-20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-primary"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Bell size={18} className="text-gray-500 mr-3" />
                        <span>Push Notifications</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={notificationSettings.push}
                          onChange={() => setNotificationSettings({
                            ...notificationSettings,
                            push: !notificationSettings.push
                          })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-theme-primary peer-focus:ring-opacity-20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-primary"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Phone size={18} className="text-gray-500 mr-3" />
                        <span>SMS Notifications</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={notificationSettings.sms}
                          onChange={() => setNotificationSettings({
                            ...notificationSettings,
                            sms: !notificationSettings.sms
                          })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-theme-primary peer-focus:ring-opacity-20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-primary"></div>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium text-gray-700">Notification Types</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Price Alerts</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={notificationSettings.priceAlerts}
                          onChange={() => setNotificationSettings({
                            ...notificationSettings,
                            priceAlerts: !notificationSettings.priceAlerts
                          })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-theme-primary peer-focus:ring-opacity-20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-primary"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Weather Alerts</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={notificationSettings.weatherAlerts}
                          onChange={() => setNotificationSettings({
                            ...notificationSettings,
                            weatherAlerts: !notificationSettings.weatherAlerts
                          })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-theme-primary peer-focus:ring-opacity-20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-primary"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Government Updates</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={notificationSettings.governmentUpdates}
                          onChange={() => setNotificationSettings({
                            ...notificationSettings,
                            governmentUpdates: !notificationSettings.governmentUpdates
                          })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-theme-primary peer-focus:ring-opacity-20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-primary"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Market Insights</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={notificationSettings.marketInsights}
                          onChange={() => setNotificationSettings({
                            ...notificationSettings,
                            marketInsights: !notificationSettings.marketInsights
                          })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-theme-primary peer-focus:ring-opacity-20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-primary"></div>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    className="bg-theme-primary text-white py-2 px-4 rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-primary"
                  >
                    Save Notification Settings
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Shield size={20} className="text-theme-primary mr-3" />
                        <div>
                          <h4 className="font-medium">Password</h4>
                          <p className="text-sm text-gray-500">Last changed 3 months ago</p>
                        </div>
                      </div>
                      <button className="text-theme-primary hover:underline">
                        Change
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Phone size={20} className="text-theme-primary mr-3" />
                        <div>
                          <h4 className="font-medium">Two-Factor Authentication</h4>
                          <p className="text-sm text-gray-500">Not enabled</p>
                        </div>
                      </div>
                      <button className="text-theme-primary hover:underline">
                        Enable
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Calendar size={20} className="text-theme-primary mr-3" />
                        <div>
                          <h4 className="font-medium">Login History</h4>
                          <p className="text-sm text-gray-500">View your recent login activity</p>
                        </div>
                      </div>
                      <button className="text-theme-primary hover:underline">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}