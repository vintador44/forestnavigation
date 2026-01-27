FROM node:18-alpine

WORKDIR /app


COPY package*.json ./
RUN npm install


COPY . .


ENV REACT_APP_API_URL=http://localhost:5000
ENV REACT_APP_YANDEX_MAPS_API_KEY=70d414d5-4c65-4009-8b4f-813f0d72c70c


RUN addgroup -g 1001 -S nodejs && \
    adduser -S reactuser -u 1001
RUN chown -R reactuser:nodejs /app
USER reactuser


EXPOSE 3000


CMD ["npm", "start"]