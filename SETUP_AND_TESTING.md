# 🚀 Гайд по запуску и тестированию Sentinel Agent

## 1️⃣ ПРЕДВАРИТЕЛЬНЫЕ ТРЕБОВАНИЯ

```bash
# Обязательно установи:
- Node.js 18+ (https://nodejs.org/)
- Python 3.9+ (https://python.org/) - для CV компонентов
- Git (https://git-scm.com/)
- Google Gemini API ключ (https://aistudio.google.com/app/apikeys)
```

## 2️⃣ УСТАНОВКА И ЗАПУСК

### Шаг 1: Клонирование проекта

```bash
git clone https://github.com/Fisterovna2/sentinel-agent
cd sentinel-agent
```

### Шаг 2: Установка зависимостей

```bash
npm install

# Если нужны CV компоненты, установи OpenCV:
pip install opencv-python
```

### Шаг 3: Настройка окружения

```bash
# Скопируй файл конфигурации
cp .env.example .env

# Отредактируй .env и добавь свой API ключ:
# GEMINI_API_KEY=твой_ключ_здесь
```

### Шаг 4: Запуск основного агента

```bash
node src/index.js
```

## 3️⃣ ТЕСТИРОВАНИЕ КОМПОНЕНТОВ

### 🧠 Тест 1: Проверка OpenCV детектора

```javascript
// файл: test-vision.js
const OpenCVDetector = require('./src/vision/opencv-detector');

const detector = new OpenCVDetector();

// Тестируем детекцию объектов
(async () => {
  try {
    const objects = await detector.detectObjects('./screenshot.png');
    console.log('✅ Обнаружены объекты:', objects);
  } catch (error) {
    console.error('❌ Ошибка детекции:', error.message);
  }
})();
```

### 🧐 Тест 2: Проверка системы обучения

```javascript
// файл: test-replay.js
const ReplaySystem = require('./src/learning/replay-system');

const replay = new ReplaySystem();

// Записываем сессию
const sessionId = replay.recordSession('Roblox', [
  { type: 'mouse_move', x: 100, y: 200 },
  { type: 'mouse_click', button: 'left' },
  { type: 'keyboard', key: 'w' }
], 0.85);

console.log('✅ Записана сессия:', sessionId);

// Обучаемся на успешных сессиях
const stats = replay.learnFromSuccessfulReplays(0.7);
console.log('📊 Статистика обучения:', stats);
```

### 🌐 Тест 3: Проверка Web API

```javascript
// файл: test-api.js
const APIServer = require('./src/web/api-server');
const AgentCore = require('./src/agent-core'); // главный агент

const agent = new AgentCore();
const api = new APIServer(agent, { port: 8080 });
api.start();

console.log('🌐 API запущен на http://localhost:8080');
```

**Тестируем API с curl:**

```bash
# 1. Получить статус
curl -X GET http://localhost:8080/api/status \
  -H "Authorization: Bearer твой_jwt_токен"

# 2. Отправить задачу
curl -X POST http://localhost:8080/api/task \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer твой_jwt_токен" \
  -d '{
    "type": "scout",
    "target": "player",
    "params": {"game": "Roblox"}
  }'

# 3. Одобрить задачу
curl -X POST http://localhost:8080/api/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer твой_jwt_токен" \
  -d '{"taskId": "task_id_здесь"}'
```

### 🤖 Тест 4: Проверка координатора многоагентов

```javascript
// файл: test-coordinator.js
const MultiAgentCoordinator = require('./src/agents/multi-agent-coordinator');
const SentinelAgent = require('./src/agents/sentinel-agent');

const coordinator = new MultiAgentCoordinator();

// Регистрируем агентов
coordinator.registerAgent('agent-1', new SentinelAgent({ id: 'agent-1' }));
coordinator.registerAgent('agent-2', new SentinelAgent({ id: 'agent-2' }));

// Распределяем задачу
(async () => {
  const subtasks = [
    { type: 'scout', target: 'area-1' },
    { type: 'collect', target: 'resources-1' },
    { type: 'return', target: 'base' }
  ];
  
  const results = await coordinator.distributeTask('complex-task', subtasks);
  console.log('✅ Результаты выполнения:', results);
})();
```

## 4️⃣ ПОЛНЫЙ ТЕСТОВЫЙ СКРИПТ

```bash
# Создай файл: run-tests.sh
#!/bin/bash

echo "🚀 Запуск полного тестирования Sentinel Agent..."

echo "\n1️⃣ Тест OpenCV детектора"
node test-vision.js

echo "\n2️⃣ Тест системы обучения"
node test-replay.js

echo "\n3️⃣ Тест Web API (фон)"
node test-api.js &
API_PID=$!
sleep 2

echo "\n4️⃣ Тест запросов к API"
curl http://localhost:8080/api/status

echo "\n5️⃣ Тест координатора"
node test-coordinator.js

echo "\n✅ Все тесты завершены!"
kill $API_PID
```

## 5️⃣ ПРОВЕРКА ЛОГОВ

```bash
# Смотри логи в реальном времени
tail -f sandbox/audit.log      # Все действия агента
tail -f sandbox/security.log   # Ошибки безопасности

# Анализируй логи
grep "ERROR" sandbox/*.log
grep "TASK_COMPLETED" sandbox/audit.log
```

## 6️⃣ УСТРАНЕНИЕ НЕИСПРАВНОСТЕЙ

### ❌ Проблема: "Cannot find module 'opencv4nodejs'"

```bash
# Решение: переустанови зависимости
npm install --build-from-source
pip install opencv-python
```

### ❌ Проблема: "GEMINI_API_KEY not found"

```bash
# Проверь что .env файл правильно заполнен
cat .env

# Переустанови
cp .env.example .env
# отредактируй файл
vim .env
```

### ❌ Проблема: Port 8080 already in use

```bash
# Найди процесс на порту
lsof -i :8080

# Убей процесс
kill -9 <PID>

# Или используй другой порт
PORT=8081 node src/web/api-server.js
```

## 7️⃣ ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Пример 1: Запуск простой задачи

```javascript
const agent = require('./src/agent-core');

agent.executeTask({
  type: 'scout',
  game: 'Roblox',
  target: 'treasure_area'
});
```

### Пример 2: Запись и анализ сессии

```javascript
const ReplaySystem = require('./src/learning/replay-system');
const replay = new ReplaySystem();

// Запись
const sessionId = replay.recordSession('Minecraft', actions, 0.9);

// Анализ
const stats = replay.getStats();
console.log('Средний успех:', stats.averageSuccessRate);
console.log('Лучшие паттерны:', stats.topPatterns);
```

### Пример 3: Детекция объектов

```javascript
const OpenCVDetector = require('./src/vision/opencv-detector');
const detector = new OpenCVDetector();

// Детекция по цвету (красные объекты)
const redObjects = await detector.detectByColor('./game.png', {
  lower: [0, 100, 100],
  upper: [10, 255, 255]
});

console.log('Обнаружено красных объектов:', redObjects.length);
```

## 8️⃣ МЕТРИКИ И МОНИТОРИНГ

```bash
# Проверь использование памяти
watch -n 1 'ps aux | grep node'

# Смотри метрики системы
node -e "console.log(process.memoryUsage())"

# Профилирование
node --prof src/index.js
node --prof-process isolate-*.log > profile.txt
```

## ✅ УСПЕШНАЯ УСТАНОВКА - ПРИЗНАКИ

✔️ `npm install` завершен без ошибок
✔️ `.env` файл содержит GEMINI_API_KEY
✔️ `node src/index.js` запускается без crash'а
✔️ Web API отвечает на запросы
✔️ Логи записываются в `sandbox/`
✔️ Все модули импортируются без ошибок

---

**Нужна помощь?** Открой issue на GitHub! 🎉
