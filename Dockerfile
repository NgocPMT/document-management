FROM oven/bun:1.3.5

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

# copy all code, after installing dependencies
COPY . .

# expose port for container
EXPOSE 4000

CMD ["bun", "run"]