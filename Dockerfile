FROM node:lts-alpine
LABEL maintainer="leon.machens@gmail.com"

EXPOSE 5000

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY dist dist

RUN npm install --production

CMD ["npm", "start"]