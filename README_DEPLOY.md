# 🚀 Инструкции по развертыванию на Render.com

## Проблема решена! ✅

**Проблема**: 404 ошибка при переходе на сайт была вызвана тем, что на Render.com развертывался только backend (FastAPI), но frontend (React) не был доступен.

**Решение**: Настроил FastAPI для обслуживания статических файлов React приложения.

## 📁 Структура проекта
```
/
├── backend/
│   ├── server.py       # FastAPI сервер (модифицирован для статических файлов)
│   ├── database.py     # PostgreSQL модели
│   └── requirements.txt # Python зависимости
├── frontend/
│   ├── build/          # Собранное React приложение
│   └── src/            # Исходный код React
└── start.sh            # Скрипт запуска для Render.com
```

## 🛠️ Настройки для Render.com

### Build Command:
```bash
chmod +x start.sh && ./start.sh
```

### Start Command:
```bash
cd backend && uvicorn server:app --host 0.0.0.0 --port 10000
```

### Environment Variables:
- `DATABASE_URL`: ваша PostgreSQL строка подключения от Render
- `CORS_ORIGINS`: `*` (или конкретные домены)

## 🔧 Что было изменено:

1. **FastAPI сервер** модифицирован для обслуживания React файлов
2. **React приложение** собрано в production режиме
3. **Routing**: 
   - `/api/*` - API маршруты
   - `/*` - React приложение (SPA routing)
4. **Статические файлы** подключены через FastAPI

## 🚀 Развертывание:

1. Загрузите код на GitHub
2. Создайте Web Service на Render.com
3. Укажите Build и Start команды выше
4. Добавьте переменные окружения
5. Деплой готов!

## ✨ Результат:
- ✅ Главная страница "/" показывает React приложение
- ✅ API доступно через "/api/*"
- ✅ SPA роутинг работает корректно
- ✅ Нет больше 404 ошибок!