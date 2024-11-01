FROM node:22-alpine3.20

# set default dir so that next commands executes in /home/app dir
WORKDIR /app

COPY package*.json ./

# will execute npm install in /home/app because of WORKDIR
RUN npm ci

COPY . .

EXPOSE 3000 4000

# no need for /home/app/server.js because of WORKDIR
CMD ["node", "index.js"]