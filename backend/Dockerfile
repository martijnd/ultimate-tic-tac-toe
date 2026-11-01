FROM node:26-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY index.js rooms.js rules.js ./
ENV NODE_ENV=production PORT=5001 HOST=0.0.0.0
USER node
EXPOSE 5001
CMD ["node", "index.js"]
