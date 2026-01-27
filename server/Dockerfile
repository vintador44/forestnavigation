FROM node:18

WORKDIR /app

# Устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем весь проект
COPY . .

# Создаём non-root пользователя
RUN groupadd -r -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodeuser
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Открываем порт
EXPOSE 5000

# Запускаем приложение
CMD ["sh", "-c", "sleep 20 && npm run dev"]  