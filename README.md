![archcook](https://user-images.githubusercontent.com/49750349/169159798-76262bc1-18c2-40cc-bddd-a2ca080a00c4.png)
# archway-dapps-cookieclicker

This application allows you to play CookieClicker a little. It is based on working with the Archway network and with a smart contract

<img width="782" alt="image" src="https://user-images.githubusercontent.com/49750349/169161479-a04c7245-edc1-4bc6-b82e-bc04e549b547.png">

There are two ways to start a project. Through docker or without docker.

To work correctly, set REACT_APP_CONTRACT_ADDRESS in the environment. Based on what the installation is.
My test smart contract: archway10hv6ujwcq7cp7r88kyenww23469t8c3sfhmnpcsypq8vshxnf60snfdwjw
Source code: https://github.com/mezhcoder/archway-cookieclicker-contracts
I moved the .env helper file to the frontend to make it easier to include the environment variable
# Install without Docker
```bash
git clone https://github.com/mezhcoder/archway-dapps-cookieclicker
cd archway-dapps-cookieclicker/frontend
npm i
npm run start
```
# Install with Docker
```bash
git clone https://github.com/mezhcoder/archway-dapps-cookieclicker
cd archway-dapps-cookieclicker
docker compose build
docker compose up
```

# Technology
Used NodeJS. Frontend is part of React and additional libraries for working with it.
The following libraries were used in working with Dapps:
- [@cosmjs/stargate](https://www.npmjs.com/package/@cosmjs/stargate)
- [@cosmjs/cosmwasm-stargate](https://www.npmjs.com/package/@cosmjs/cosmwasm-stargate)
- [@cosmjs/proto-signing](https://www.npmjs.com/package/@cosmjs/proto-signing)

💚 I hope you enjoy the app, I tried