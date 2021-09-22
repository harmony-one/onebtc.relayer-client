# onebtc.relayer-client
Harmony ONE BTC relayer client

## Install instructions

### Requirements 

* nodejs 

### Commands

* Fetch repo 

```
git clone git@github.com:harmony-one/onebtc.relayer-client.git
```

* Install dependencies

```
npm install
```

* Develop

```
npm run build
npm run start:watch
```

* Build

```
npm run build
```

* Start prod

```
npm run start:prod
```

* How to get all info 

```
curl --location --request GET 'http://localhost:8080/height'
curl --location --request GET 'http://localhost:8080/info'
```

# Docker

## build ethhmy-be docker image
```
./build.sh
```
