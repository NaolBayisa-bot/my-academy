FROM node:20-alpine
workdir /app
COPY package.json package-lock.json ./
RUN npm install
COPY src ./src
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node","src/index.js"]