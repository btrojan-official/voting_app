FROM node:lts

WORKDIR /frontend
COPY package.json /frontend/package.json
COPY package-lock.json /frontend/package-lock.json
COPY tsconfig.json /frontend/tsconfig.json
RUN npm ci

COPY . /frontend

CMD ["npm", "start"]