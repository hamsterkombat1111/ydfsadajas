import React, { useState, useEffect } from 'react';
import './App.css';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { Alert, AlertDescription } from './components/ui/alert';
import { Toaster } from './components/ui/toaster';
import { useToast } from './components/ui/use-toast';
import { Shield, Users, ExternalLink, Settings, AlertTriangle, LogIn, LogOut, Eye, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ name: '', telegram_id: '' });
  const [visits, setVisits] = useState([]);
  const [blockedIps, setBlockedIps] = useState([]);
  const [newBlockedIp, setNewBlockedIp] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Логируем посещение при загрузке
    logVisit();
    
    // Проверяем авторизацию из localStorage
    const savedAuth = localStorage.getItem('isAdmin');
    if (savedAuth === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  // Загружаем данные администратора при изменении статуса авторизации
  useEffect(() => {
    if (isLoggedIn) {
      loadAdminData();
    }
  }, [isLoggedIn]);

  const logVisit = async () => {
    try {
      const userAgent = navigator.userAgent;
      await fetch(`${BACKEND_URL}/api/log-visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_agent: userAgent })
      });
    } catch (error) {
      console.error('Failed to log visit:', error);
    }
  };

  const handleLogin = async () => {
    if (loginData.username === 'admin' && loginData.password === 'qwerqwer') {
      setIsLoggedIn(true);
      localStorage.setItem('isAdmin', 'true');
      toast({
        title: "Успешно!",
        description: "Вы вошли как администратор",
      });
      // loadAdminData() будет вызвана автоматически через useEffect
    } else {
      toast({
        title: "Ошибка",
        description: "Неверные данные для входа",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isAdmin');
    toast({
      title: "Выход",
      description: "Вы вышли из системы",
    });
  };

  // Загружаем публичные данные (список администраторов)
  const loadPublicData = async () => {
    try {
      const adminsRes = await fetch(`${BACKEND_URL}/api/admins`);
      setAdmins(await adminsRes.json());
    } catch (error) {
      console.error('Failed to load public data:', error);
    }
  };

  // Загружаем данные только для авторизованных админов
  const loadAdminData = async () => {
    try {
      const [visitsRes, ipsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/visits`),
        fetch(`${BACKEND_URL}/api/blocked-ips`)
      ]);
      
      setVisits(await visitsRes.json());
      setBlockedIps(await ipsRes.json());
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  const addAdmin = async () => {
    if (!newAdmin.name || !newAdmin.telegram_id) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin)
      });
      
      if (response.ok) {
        toast({ title: "Администратор добавлен!" });
        setNewAdmin({ name: '', telegram_id: '' });
        loadAdminData();
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить администратора",
        variant: "destructive",
      });
    }
  };

  const blockIp = async () => {
    if (!newBlockedIp) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/block-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: newBlockedIp })
      });
      
      if (response.ok) {
        toast({ title: "IP адрес заблокирован!" });
        setNewBlockedIp('');
        loadAdminData();
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось заблокировать IP",
        variant: "destructive",
      });
    }
  };

  const removeAdmin = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/api/admins/${id}`, { method: 'DELETE' });
      toast({ title: "Администратор удален!" });
      loadAdminData();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить администратора",
        variant: "destructive",
      });
    }
  };

  const unblockIp = async (ip) => {
    try {
      await fetch(`${BACKEND_URL}/api/unblock-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      });
      toast({ title: "IP адрес разблокирован!" });
      loadAdminData();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось разблокировать IP",
        variant: "destructive",
      });
    }
  };

  if (showDisclaimer) {
    return (
      <div className="disclaimer-overlay">
        <div className="disclaimer-content">
          <div className="disclaimer-icon">
            <AlertTriangle className="w-16 h-16 text-amber-500" />
          </div>
          <h1 className="disclaimer-title">Внимание!</h1>
          <p className="disclaimer-text">
            Этот сайт создан исключительно в развлекательных целях. 
            Мы не хотим никого оскорбить или унизить.
          </p>
          <Button 
            onClick={() => setShowDisclaimer(false)}
            className="disclaimer-button"
          >
            Я понимаю, продолжить
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Toaster />
      
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <Shield className="w-8 h-8 text-cyan-400" />
            <h1 className="logo-text">PrankVZ</h1>
          </div>
          
          <div className="auth-section">
            {!isLoggedIn ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="auth-button">
                    <LogIn className="w-4 h-4 mr-2" />
                    Вход
                  </Button>
                </DialogTrigger>
                <DialogContent className="auth-dialog">
                  <DialogHeader>
                    <DialogTitle>Вход в админ панель</DialogTitle>
                    <DialogDescription>
                      Введите данные для входа в систему администрирования
                    </DialogDescription>
                  </DialogHeader>
                  <div className="auth-form">
                    <div className="form-group">
                      <Label htmlFor="username">Логин</Label>
                      <Input
                        id="username"
                        type="text"
                        value={loginData.username}
                        onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <Label htmlFor="password">Пароль</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      />
                    </div>
                    <Button onClick={handleLogin} className="w-full">
                      Войти
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <div className="admin-section">
                <Badge variant="secondary" className="admin-badge">
                  <Settings className="w-3 h-3 mr-1" />
                  Админ
                </Badge>
                <Button variant="outline" onClick={handleLogout} className="logout-button">
                  <LogOut className="w-4 h-4 mr-2" />
                  Выход
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <Tabs defaultValue="info" className="main-tabs">
          <TabsList className="tabs-list">
            <TabsTrigger value="info" className="tab-trigger">
              <Users className="w-4 h-4 mr-2" />
              Информация
            </TabsTrigger>
            <TabsTrigger value="buttons" className="tab-trigger">
              <ExternalLink className="w-4 h-4 mr-2" />
              Ссылки
            </TabsTrigger>
            <TabsTrigger value="admins" className="tab-trigger">
              <Shield className="w-4 h-4 mr-2" />
              Администраторы
            </TabsTrigger>
            <TabsTrigger value="popup" className="tab-trigger">
              <Eye className="w-4 h-4 mr-2" />
              Popup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="tab-content">
            <Card className="info-card">
              <CardHeader>
                <CardTitle className="card-title">
                  <Users className="w-6 h-6 mr-2" />
                  Добро пожаловать на PrankVZ!
                </CardTitle>
                <CardDescription className="card-description">
                  Развлекательный портал для всех любителей юмора
                </CardDescription>
              </CardHeader>
              <CardContent className="card-content">
                <p className="info-text">
                  Здесь вы найдете множество интересных материалов, розыгрышей и развлечений. 
                  Присоединяйтесь к нашему сообществу в Telegram для получения актуальных новостей!
                </p>
                <Button 
                  className="telegram-button"
                  onClick={() => window.open('https://t.me/PrankVZ', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Перейти в Telegram канал
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="buttons" className="tab-content">
            <div className="buttons-grid">
              {[1, 2, 3, 4, 5, 6].map(num => (
                <Card key={num} className="button-card">
                  <CardContent className="button-card-content">
                    <Button 
                      className="site-button"
                      onClick={() => window.open('#', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Кнопка {num}
                    </Button>
                    <p className="button-description">
                      Описание для кнопки {num}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="admins" className="tab-content">
            <div className="admins-section">
              {isLoggedIn && (
                <Card className="admin-controls">
                  <CardHeader>
                    <CardTitle>Управление администраторами</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="admin-form">
                      <div className="form-row">
                        <Input
                          placeholder="Имя администратора"
                          value={newAdmin.name}
                          onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                        />
                        <Input
                          placeholder="Telegram ID"
                          value={newAdmin.telegram_id}
                          onChange={(e) => setNewAdmin({...newAdmin, telegram_id: e.target.value})}
                        />
                        <Button onClick={addAdmin}>
                          Добавить
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="admins-list">
                <CardHeader>
                  <CardTitle>Администраторы телеграм канала</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="admins-grid">
                    {admins.map(admin => (
                      <div key={admin.id} className="admin-item">
                        <div className="admin-info">
                          <span className="admin-name">{admin.name}</span>
                          <span className="admin-id">ID: {admin.telegram_id}</span>
                        </div>
                        {isLoggedIn && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => removeAdmin(admin.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="popup" className="tab-content">
            <Card className="popup-card">
              <CardHeader>
                <CardTitle>Секретная информация</CardTitle>
                <CardDescription>
                  Нажмите кнопку ниже, чтобы увидеть скрытое сообщение
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="popup-trigger-button">
                      <Eye className="w-4 h-4 mr-2" />
                      Показать секрет
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="popup-dialog">
                    <DialogHeader>
                      <DialogTitle>🎉 Секретное сообщение!</DialogTitle>
                      <DialogDescription>
                        Поздравляем! Вы нашли скрытое сообщение. 
                        Это значит, что вы настоящий исследователь! 
                        Продолжайте изучать наш сайт и находить новые интересные вещи!
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Admin Panel */}
        {isLoggedIn && (
          <div className="admin-panel">
            <Card className="admin-panel-card">
              <CardHeader>
                <CardTitle>Панель администратора</CardTitle>
              </CardHeader>
              <CardContent className="admin-panel-content">
                <Tabs defaultValue="visits" className="admin-tabs">
                  <TabsList>
                    <TabsTrigger value="visits">Логи посещений</TabsTrigger>
                    <TabsTrigger value="ips">Блокировка IP</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="visits">
                    <div className="visits-list">
                      {visits.slice(0, 10).map((visit, index) => (
                        <div key={index} className="visit-item">
                          <span className="visit-ip">{visit.ip}</span>
                          <span className="visit-time">{new Date(visit.timestamp).toLocaleString()}</span>
                          <span className="visit-browser">{visit.user_agent}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="ips">
                    <div className="ip-controls">
                      <div className="ip-form">
                        <Input
                          placeholder="IP адрес для блокировки"
                          value={newBlockedIp}
                          onChange={(e) => setNewBlockedIp(e.target.value)}
                        />
                        <Button onClick={blockIp}>Заблокировать</Button>
                      </div>
                      <div className="blocked-ips">
                        {blockedIps.map(ip => (
                          <div key={ip} className="blocked-ip-item">
                            <span>{ip}</span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => unblockIp(ip)}
                            >
                              Разблокировать
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;