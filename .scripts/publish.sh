node ./.scripts/version.js
NODE_ENV="production" && yarn build
cd packages/maath
npm publish