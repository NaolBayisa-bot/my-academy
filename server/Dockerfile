FROM node:20-alpine
WORKDIR /app

# Runtime dependencies plus CLI tooling. NODE_ENV is set after `npm ci` so
# devDependencies (including sequelize-cli) are installed for the build step.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the migration framework (config/.sequelizerc/migrations) so the
# container can apply schema migrations at startup.
COPY .sequelizerc .sequelizerc
COPY config ./config
COPY migrations ./migrations

COPY src ./src

ENV NODE_ENV=production
EXPOSE 5000

# Apply migrations, then start the API. Schema is managed by migrations;
# the app no longer auto-syncs models.
CMD ["sh", "-c", "npm run db:migrate && node src/index.js"]