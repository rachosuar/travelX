<h1 align="center">TRAVEL X MARKETPLACE </h1>

<p align="center">
    <p align="center">  <a href="https://www.travelx.io/" target="_blank" rel="noreferrer"> <img src="https://www.travelx.io/wp-content/uploads/2022/02/logo-black.svg" alt="travelX" width="200" height="200"/> </a>
</p>

## Situation

- TravelX needed a marketplace to buy and sell NFTickets and to do it entirelly on the blockchain, in a decentralized way. So we created a marketplace that takes USDC (in this case is a fake ERC-20 token we created for the occasion) and in the same transaction then recieves the tokens it transfers the NFTicket to the buyer. 5% of each sale goes as a royalty to an Open Zeppelin splitter contract that divides fees for TravelX and the Airline

## Arquitecture

<img src="./arch.png" alt="arch" width="300" height="300">

## Technology Stack & Tools

- Solidity (Writing Smart Contracts & Tests)
- Javascript (Scripts & Testing)
- [Hardhat](https://hardhat.org/) (Development Framework)
- [Ethers.js](https://docs.ethers.io/v5/) (Blockchain Interaction)

## Requirements For Initial Setup

- Install [NodeJS](https://nodejs.org/en/)

## Setting Up

### 1. Clone/Download the Repository

### 2. Install Dependencies:

`$ npm install`

### 3. Run tests

`$ npm test`

### 4. Start Hardhat node

`$ npm start`

### 5. Run deployment script

In a separate terminal execute:
`$ npm run`
