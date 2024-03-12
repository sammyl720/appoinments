FROM node:18

WORKDIR /app

COPY package.json ./

COPY yarn.lock ./

RUN apt update && apt install tzdata -y

RUN yarn install

COPY . .

RUN yarn run build

ENV TZ="America/New_York"

EXPOSE ${PORT}

CMD ["yarn", "start" ]