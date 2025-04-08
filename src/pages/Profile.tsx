
import { useState } from "react";
import { Settings, LogOut, Moon, Sun, Bell, ChevronRight } from "lucide-react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { MOCK_USER } from "@/models/user";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const Profile = () => {
  const [user] = useState(MOCK_USER);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  
  // Helper function to get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };
  
  return (
    <Layout>
      <div className="p-4 space-y-5">
        <h1 className="text-2xl font-bold">Profile</h1>
        
        {/* User info */}
        <Card>
          <CardContent className="p-4 flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-communi-primary text-white">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h2 className="font-semibold text-lg">{user.name}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex items-center mt-1">
                <span className="text-xs bg-communi-primary/10 text-communi-primary px-2 py-0.5 rounded-full">
                  Level {user.level}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Settings */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Settings</h2>
          
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Moon size={18} className="mr-3 text-gray-500" />
                  <span>Dark Mode</span>
                </div>
                <Switch 
                  checked={darkMode} 
                  onCheckedChange={setDarkMode} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell size={18} className="mr-3 text-gray-500" />
                  <span>Notifications</span>
                </div>
                <Switch 
                  checked={notifications} 
                  onCheckedChange={setNotifications} 
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Account */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Account</h2>
          
          <Card>
            <CardContent className="p-0">
              <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                <span>Edit Profile</span>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
              
              <Separator />
              
              <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                <span>Language</span>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">English</span>
                  <ChevronRight size={18} className="text-gray-400" />
                </div>
              </div>
              
              <Separator />
              
              <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 text-red-500">
                <span>Log Out</span>
                <LogOut size={18} />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* About */}
        <div className="text-center text-xs text-gray-500 pt-4">
          <p>CommuniLingo v1.0.0</p>
          <p className="mt-1">© 2023 CommuniLingo. All rights reserved.</p>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
