FROM node:22-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev
COPY . .
EXPOSE 3001
CMD ["node", "backend/server.js"]
