FROM node:16

WORKDIR /app

COPY package.json ./

COPY yarn.lock ./

RUN yarn install

COPY . .

RUN yarn build

RUN apt update && apt install tzdata -y
ENV TZ="America/New_York"

EXPOSE ${PORT}

CMD ["yarn", "start" ]