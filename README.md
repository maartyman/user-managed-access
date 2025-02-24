# Pacsoi POC 

This repository contains a demonstrator for the [SolidLab project](https://solidlab.be/) on managing trust-flows in decentralized data storage systems such as Solid.


## Cloning the repository

To run the demonstrator, you will have to clone the repository.
```
git clone -b feat/contracts git@github.com:SolidLabResearch/user-managed-access.git

cd user-managed-access/
```

## Getting started

### Setting up the Authorization Server 

Before starting, make sure you are on the correct branch (pacsoi-poc1).
See the above command to clone only the relevant branch for the demonstrator.

In order to run the demonstrator you need to perform the following steps. 

1. Ensure that you are using Node.js 20 or higher, e.g. by running `nvm use`. (see [.nvmrc](./.nvmrc))
2. Enable Node.js Corepack with `corepack enable`.
3. Run `yarn install` in the project root to install the requirements.
4. Run `yarn build` in the project root to build.
5. Run `yarn run start:demo` in the project root to start all services.


### Docker

To build the docker image, run
```
bash dockerize.sh 
```

To run the docker image, run
```
docker compose up
```


### Running the Pacsoi demo flow
Following the demo flow, first run this AS either directly or in the docker image.

Secondly, run the mock resource server, located [here](https://github.com/SolidLabResearch/UMA_Resource_Server).

Thirdly, run the external client flow located [here](https://github.com/SolidLabResearch/UMA_Client).