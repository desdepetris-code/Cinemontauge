import React, { useState, useEffect } from 'react';
import { TrashIcon, ChevronRightIcon, ArrowPathIcon, UploadIcon, DownloadIcon } from '../components/Icons';
import FeedbackForm from '../components/FeedbackForm';
import Legal from './Legal';
import { NotificationSettings, Theme, WatchProgress, HistoryItem, EpisodeRatings, FavoriteEpisodes, TrackedItem, PrivacySettings, UserData, ProfileTheme } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ThemeSettings from '../components/ThemeSettings';
import ResetPasswordModal from '../components/ResetPasswordModal';
import TimezoneSettings from '../components/TimezoneSettings';

const SettingsRow: React.FC<{ title: string; subtitle: string; children: React.ReactNode; isDestructive?: boolean; onClick?: () => void, disabled?: boolean }> = ({ title, subtitle, children, isDestructive, onClick, disabled }) => (
    <div 
        className={`flex justify-between items-center p-4 border-b border-bg-secondary/50 last:border-b-0 ${isDestructive ? 'text-red-500' : ''} ${onClick && !disabled ? 'cursor-pointer hover:bg-bg-secondary/50' : ''} ${disabled ? 'opacity-50' : ''}`}
        onClick={disabled ? undefined : onClick}
    >
        <div>
            <h3 className={`font-semibold ${isDestructive ? '' : 'text-text-primary'}`}>{title}</h3>
            <p className="text-sm text-text-secondary">{subtitle}</p>
        </div>
        <div className="flex-shrink-0 ml-4">
            {children}
        </div>
    </div>
);

const SettingsCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-card-gradient rounded-lg shadow-md overflow-hidden mb-8">
      <div className="p-4 border-b border-bg-secondary/50">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-accent-gradient">{title}</h2>
      </div>
      <div className="animate-fade-in">
        {children}
      </div>
    </div>
);

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; disabled?: boolean }> = ({ enabled, onChange, disabled }) => (
    <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${enabled ? 'bg-primary-accent' : 'bg-bg-secondary'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${enabled ? 'translate-x-5' : ''}`}/>
    </button>
);

const GoogleIcon: React.FC = () => (
    <svg viewBox="0 0 48 48" className="w-5 h-5">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
);

interface User {
    id: string;
    username: string;
    email: string;
}

interface SettingsProps {
    userData: UserData;
    notificationSettings: NotificationSettings;
    setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
    privacySettings: PrivacySettings;
    setPrivacySettings: React.Dispatch<React.SetStateAction<PrivacySettings>>;
    setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
    setWatchProgress: React.Dispatch<React.SetStateAction<WatchProgress>>;
    setEpisodeRatings: React.Dispatch<React.SetStateAction<EpisodeRatings>>;
    setFavoriteEpisodes: React.Dispatch<React.SetStateAction<FavoriteEpisodes>>;
    setTheme: (themeId: string) => void;
    customThemes: Theme[];
    setCustomThemes: React.Dispatch<React.SetStateAction<Theme[]>>;
    onLogout: () => void;
    onUpdatePassword: (passwords: { currentPassword: string; newPassword: string; }) => Promise<string | null>;
    onForgotPasswordRequest: (email: string) => Promise<string | null>;
    onForgotPasswordReset: (data: { code: string; newPassword: string; }) => Promise<string | null>;
    currentUser: User | null;
    setCompleted: React.Dispatch<React.SetStateAction<TrackedItem[]>>;
    timezone: string;
    setTimezone: (timezone: string) => void;
    onRemoveDuplicateHistory: () => void;
    autoHolidayThemesEnabled: boolean;
    setAutoHolidayThemesEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    holidayAnimationsEnabled: boolean;
    setHolidayAnimationsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    profileTheme: ProfileTheme | null;
    setProfileTheme: React.Dispatch<React.SetStateAction<ProfileTheme | null>>;
    textSize: number;
    setTextSize: React.Dispatch<React.SetStateAction<number>>;
    userLevel: number;
}

const Settings: React.FC<SettingsProps> = (props) => {
  const { notificationSettings, setNotificationSettings, privacySettings, setPrivacySettings, setHistory, setWatchProgress, setEpisodeRatings, setFavoriteEpisodes, setTheme, setCustomThemes, onLogout, onUpdatePassword, onForgotPasswordRequest, onForgotPasswordReset, currentUser, setCompleted, userData, timezone, setTimezone, onRemoveDuplicateHistory, autoHolidayThemesEnabled, setAutoHolidayThemesEnabled, holidayAnimationsEnabled, setHolidayAnimationsEnabled, profileTheme, setProfileTheme, textSize, setTextSize, userLevel } = props;
  const [activeView, setActiveView] = useState<'settings' | 'legal'>('settings');
  const [autoBackupEnabled, setAutoBackupEnabled] = useLocalStorage('autoBackupEnabled', false);
  const [lastLocalBackup, setLastLocalBackup] = useState<string | null>(null);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('sceneit_import_success') === 'true') {
      alert('Data imported successfully!');
      localStorage.removeItem('sceneit_import_success');
    }
    setLastLocalBackup(localStorage.getItem('auto_backup_last_timestamp'));
  }, []);

  const handleToggleNotification = (setting: keyof NotificationSettings) => {
    setNotificationSettings(prev => {
        const newState = { ...prev, [setting]: !prev[setting] };
        if (setting === 'masterEnabled' && !newState.masterEnabled) {
            return {
                ...prev,
                masterEnabled: false,
                newEpisodes: false,
                movieReleases: false,
                sounds: false,
                newFollowers: false,
                listLikes: false,
                appUpdates: false,
                importSyncCompleted: false,
            };
        }
         if (setting === 'masterEnabled' && newState.masterEnabled) {
            return {
                ...prev,
                masterEnabled: true,
                newEpisodes: true,
                movieReleases: true,
                sounds: true,
                newFollowers: true,
                listLikes: true,
                appUpdates: true,
                importSyncCompleted: true,
            };
        }
        return newState;
    });
  };

  const handleExportData = () => {
    try {
        const keysToExport = [
            'watching_list', 'plan_to_watch_list', 'completed_list', 'favorites_list',
            'watch_progress', 'history', 'custom_image_paths', 'notifications',
            'favorite_episodes', 'customThemes', 'trakt_token', 'themeId'
        ];
        
        const dataToExport: Record<string, any> = {};
        
        keysToExport.forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                try {
                    dataToExport[key] = JSON.parse(item);
                } catch (e) {
                    dataToExport[key] = item;
                }
            }
        });

        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sceneit_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to export data", error);
        alert("An error occurred while exporting your data.");
    }
  };

  const handleImportData = (source: 'file' | 'local') => {
    const processData = (dataText: string | null) => {
        if (!dataText) {
            alert(source === 'local' ? "No local backup data found to restore from." : "No file selected.");
            return;
        }
        try {
            const data = JSON.parse(dataText);

            if (source === 'local' && !data.sceneit_users) {
                alert('Error: Local backup is invalid or empty.');
                return;
            } else if (source === 'file' && !data.watching_list && !data.history && !data.themeId) {
                alert('Error: Invalid or corrupted backup file.');
                return;
            }

            if (window.confirm("This will overwrite all current data in the app with the contents of the backup. This action cannot be undone. Are you sure?")) {
                localStorage.clear();
                 if (source === 'local') {
                    Object.keys(data).forEach(key => localStorage.setItem(key, data[key]));
                } else {
                    Object.keys(data).forEach(key => {
                        const value = data[key];
                        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
                    });
                }
                
                localStorage.setItem('sceneit_import_success', 'true');
                window.location.reload();
            }
        } catch (error) {
            console.error("Failed to import data", error);
            alert("An error occurred while importing the data. The file might be corrupted.");
        }
    };

    if (source === 'file') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => processData(e.target?.result as string);
            reader.readAsText(file);
        };
        input.click();
    } else if (source === 'local') {
        processData(localStorage.getItem('sceneit_local_backup'));
    }
  };

  const handleClearHistory = () => {
    if (userData.history.length === 0 && userData.completed.length === 0) {
        alert('Your watch history and completed list are already empty.');
        return;
    }
    if (window.confirm('Are you sure you want to erase all watch history from the app? This includes your global history, history on individual show/movie pages, and will clear your "Completed" list. This action cannot be undone.')) {
        setHistory([]);
        setCompleted([]);
        alert('Watch history and completed list have been cleared successfully!');
    }
  };

  const handleResetProgress = () => {
    const hasProgress = Object.keys(userData.watchProgress).length > 0 || userData.history.length > 0 || userData.completed.length > 0;
    if (!hasProgress) {
        alert('All progress is already reset.');
        return;
    }
    if (window.confirm('Are you sure you want to reset all your progress? This will mark every episode as unwatched and clear your entire watch history. This cannot be undone.')) {
        setHistory([]);
        setWatchProgress({});
        setEpisodeRatings({});
        setFavoriteEpisodes({});
        setCompleted([]);
        alert('All watch progress, history, and completed items have been reset successfully!');
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all app settings to their default values? This will not affect your lists or progress.')) {
        setTheme('original-dark');
        setCustomThemes([]);
        setNotificationSettings({
            masterEnabled: true,
            newEpisodes: true,
            movieReleases: true,
            sounds: true,
            newFollowers: true,
            listLikes: true,
            appUpdates: true,
            importSyncCompleted: true,
            showWatchedConfirmation: true,
        });
        alert('App settings have been reset to default successfully!');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account and all data? This action is permanent and cannot be undone.')) {
        if (window.confirm('FINAL CONFIRMATION: This will delete everything. Are you absolutely sure?')) {
            alert('Account and all data deleted. The app will now reload.');
            localStorage.clear();
            window.location.reload();
        }
    }
  };

  if (activeView === 'legal') {
    return <Legal onBack={() => setActiveView('settings')} />;
  }

  return (
    <>
      <ResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        onSave={onUpdatePassword}
        onForgotPasswordRequest={onForgotPasswordRequest}
        onForgotPasswordReset={onForgotPasswordReset}
        currentUserEmail={currentUser?.email || ''}
      />
      <div className="animate-fade-in max-w-2xl mx-auto">
          <SettingsCard title="Account Management">
              <SettingsRow title="Reset Password" subtitle="Change the password for your account.">
                  <button onClick={() => setIsResetPasswordModalOpen(true)} className="px-4 py-2 text-sm rounded-md bg-bg-secondary text-text-primary hover:brightness-125 transition-colors">
                      Change
                  </button>
              </SettingsRow>
              <SettingsRow title="Log Out" subtitle="Sign out of your current session.">
                  <button onClick={onLogout} className="px-4 py-2 text-sm rounded-md bg-bg-secondary text-text-primary hover:brightness-125 transition-colors">
                      Log Out
                  </button>
              </SettingsRow>
              <SettingsRow title="Delete Account" subtitle="Permanently delete your account and all data." isDestructive>
                  <button
                      onClick={handleDeleteAccount}
                      className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  >
                      <TrashIcon className="h-4 w-4" />
                      <span>Delete</span>
                  </button>
              </SettingsRow>
          </SettingsCard>

          <SettingsCard title="Timezone">
              <TimezoneSettings timezone={timezone} setTimezone={setTimezone} />
          </SettingsCard>
          
          <SettingsCard title="Accessibility">
              <SettingsRow title="Text Size" subtitle="Adjust the application's font size.">
                  <div className="flex items-center space-x-2 bg-bg-primary p-1 rounded-lg">
                      <button onClick={() => setTextSize(s => Math.max(0.8, s - 0.1))} className="px-3 py-1 text-lg font-bold rounded-md bg-bg-secondary text-text-primary hover:brightness-125">-</button>
                      <button onClick={() => setTextSize(1)} className="px-3 py-1 text-sm font-semibold rounded-md bg-bg-secondary text-text-primary hover:brightness-125">Reset</button>
                      <button onClick={() => setTextSize(s => Math.min(1.5, s + 0.1))} className="px-3 py-1 text-lg font-bold rounded-md bg-bg-secondary text-text-primary hover:brightness-125">+</button>
                  </div>
              </SettingsRow>
               <div className="text-center pb-2 text-sm text-text-secondary">
                  Current Size: {Math.round(textSize * 100)}%
              </div>
          </SettingsCard>

          <SettingsCard title="Notifications & Preferences">
              <SettingsRow title="Enable All Notifications" subtitle="Master control for all app alerts.">
                  <ToggleSwitch enabled={notificationSettings.masterEnabled} onChange={() => handleToggleNotification('masterEnabled')} />
              </SettingsRow>
              <SettingsRow title="New Episode / Season" subtitle="Alerts for new content you're tracking." disabled={!notificationSettings.masterEnabled}>
                  <ToggleSwitch enabled={notificationSettings.newEpisodes} onChange={() => handleToggleNotification('newEpisodes')} disabled={!notificationSettings.masterEnabled}/>
              </SettingsRow>
              <SettingsRow title="Movie Releases & Updates" subtitle="News about movies on your lists (e.g., sequels)." disabled={!notificationSettings.masterEnabled}>
                  <ToggleSwitch enabled={notificationSettings.movieReleases} onChange={() => handleToggleNotification('movieReleases')} disabled={!notificationSettings.masterEnabled}/>
              </SettingsRow>
              <SettingsRow title="New Followers" subtitle="Get an alert when someone follows you." disabled={!notificationSettings.masterEnabled}>
                  <ToggleSwitch enabled={notificationSettings.newFollowers} onChange={() => handleToggleNotification('newFollowers')} disabled={!notificationSettings.masterEnabled}/>
              </SettingsRow>
              <SettingsRow title="List Likes" subtitle="Get an alert when someone likes your list." disabled={!notificationSettings.masterEnabled}>
                  <ToggleSwitch enabled={notificationSettings.listLikes} onChange={() => handleToggleNotification('listLikes')} disabled={!notificationSettings.masterEnabled}/>
              </SettingsRow>
              <SettingsRow title="Show watched confirmation banners" subtitle="Displays a confirmation when you mark something as watched.">
                  <ToggleSwitch enabled={notificationSettings.showWatchedConfirmation} onChange={() => handleToggleNotification('showWatchedConfirmation')} />
              </SettingsRow>
              <SettingsRow title="App Updates & Announcements" subtitle="Receive news, changelogs, and announcements about SceneIt." disabled={!notificationSettings.masterEnabled}>
                  <ToggleSwitch enabled={notificationSettings.appUpdates} onChange={() => handleToggleNotification('appUpdates')} disabled={!notificationSettings.masterEnabled}/>
              </SettingsRow>
              <SettingsRow title="Import/Sync Completed" subtitle="Get an alert when a large import or sync is finished." disabled={!notificationSettings.masterEnabled}>
                  <ToggleSwitch enabled={notificationSettings.importSyncCompleted} onChange={() => handleToggleNotification('importSyncCompleted')} disabled={!notificationSettings.masterEnabled}/>
              </SettingsRow>
              <SettingsRow title="Notification Sounds" subtitle="Play a sound for new notifications." disabled={!notificationSettings.masterEnabled}>
                  <ToggleSwitch enabled={notificationSettings.sounds} onChange={() => handleToggleNotification('sounds')} disabled={!notificationSettings.masterEnabled}/>
              </SettingsRow>
          </SettingsCard>
        
          <ThemeSettings 
            customThemes={props.customThemes} 
            setCustomThemes={props.setCustomThemes} 
            autoHolidayThemesEnabled={autoHolidayThemesEnabled} 
            setAutoHolidayThemesEnabled={setAutoHolidayThemesEnabled} 
            holidayAnimationsEnabled={holidayAnimationsEnabled}
            setHolidayAnimationsEnabled={setHolidayAnimationsEnabled}
            profileTheme={profileTheme} 
            setProfileTheme={setProfileTheme} 
            userLevel={userLevel}
          />

          <SettingsCard title="Privacy Settings">
              <SettingsRow title="Activity Visibility" subtitle="Control who can see your watch activity and comments.">
                  <select
                      value={privacySettings.activityVisibility}
                      onChange={e => setPrivacySettings({ activityVisibility: e.target.value as 'public' | 'followers' | 'private' })}
                      className="bg-bg-secondary text-text-primary rounded-md p-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  >
                      <option value="public">Public</option>
                      <option value="followers">Followers Only</option>
                      <option value="private">Private</option>
                  </select>
              </SettingsRow>
          </SettingsCard>

          <SettingsCard title="Data Management">
              <SettingsRow title="Download Backup" subtitle="Save a JSON file of all your data to your device.">
                  <button onClick={handleExportData} className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-bg-secondary text-text-primary hover:brightness-125">
                      <DownloadIcon className="h-4 w-4" />
                      <span>Download</span>
                  </button>
              </SettingsRow>
              <SettingsRow title="Restore from File" subtitle="Upload a backup file to restore your data.">
                  <button onClick={() => handleImportData('file')} className="flex items-center justify-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-bg-secondary text-text-primary hover:brightness-125">
                      <UploadIcon className="h-4 w-4" />
                      <span>Restore</span>
                  </button>
              </SettingsRow>
              <SettingsRow title="Automatic Local Backup" subtitle="Automatically back up data to this device every 24 hours.">
                  <ToggleSwitch enabled={autoBackupEnabled} onChange={setAutoBackupEnabled} />
              </SettingsRow>
              <div className="px-4 pb-4 border-b border-bg-secondary/50">
                  <button 
                      onClick={() => handleImportData('local')} 
                      disabled={!lastLocalBackup}
                      className="w-full text-center px-3 py-1.5 text-sm rounded-md transition-colors bg-bg-secondary text-text-primary hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      Restore from Local Backup
                  </button>
                  {lastLocalBackup && <p className="text-xs text-text-secondary text-center mt-2">Last backup: {new Date(lastLocalBackup).toLocaleString()}</p>}
              </div>
              <SettingsRow title="Remove Duplicate History" subtitle="Cleans up identical watch records logged close together.">
                  <button onClick={onRemoveDuplicateHistory} className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-bg-secondary text-text-primary hover:brightness-125">
                      <TrashIcon className="h-4 w-4" />
                      <span>Clean</span>
                  </button>
              </SettingsRow>
              <SettingsRow title="Clear Watch History" subtitle="Removes all entries from your history." isDestructive>
                  <button onClick={handleClearHistory} className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-red-500/10 text-red-500 hover:bg-red-500/20">
                      <TrashIcon className="h-4 w-4" />
                      <span>Clear</span>
                  </button>
              </SettingsRow>
              <SettingsRow title="Reset All Progress" subtitle="Marks all episodes as unwatched and clears history." isDestructive>
                  <button onClick={handleResetProgress} className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-red-500/10 text-red-500 hover:bg-red-500/20">
                      <TrashIcon className="h-4 w-4" />
                      <span>Reset</span>
                  </button>
              </SettingsRow>
              <SettingsRow title="Reset to Default Theme" subtitle="Revert theme and preferences to default." isDestructive>
                  <button onClick={handleResetSettings} className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                      <ArrowPathIcon className="h-4 w-4" />
                      <span>Reset Theme</span>
                  </button>
              </SettingsRow>
          </SettingsCard>
        
          <SettingsCard title="Legal">
              <SettingsRow 
                  title="Terms of Service & Privacy" 
                  subtitle="View the app's policies and copyright information."
                  onClick={() => setActiveView('legal')}
              >
                  <ChevronRightIcon className="h-6 w-6 text-text-secondary" />
              </SettingsRow>
          </SettingsCard>

          <SettingsCard title="Support & Feedback">
              <FeedbackForm />
          </SettingsCard>
      </div>
    </>
  );
};

export default Settings;