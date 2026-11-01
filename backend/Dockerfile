FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY index.js ./
ENV PORT=5001 HOST=0.0.0.0
EXPOSE 5001
CMD ["node", "index.js"]
