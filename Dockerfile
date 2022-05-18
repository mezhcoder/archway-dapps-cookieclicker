FROM node:14.18.0-alpine3.14
WORKDIR ./
COPY frontend/package.json ./
COPY frontend/package-lock.json ./
COPY frontend ./
RUN npm i
CMD ["npm", "run", "start"]
EXPOSE 3000