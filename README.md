# Blockchain Property Marketplace

This is a full-stack decentralized application (dApp) that simulates a real estate marketplace on the Ethereum blockchain. It allows users to take ownership of properties, list them for sale, and purchase them from others in a secure and transparent manner.

## Core Features

-   **Wallet Integration:** Users connect to the application securely using their MetaMask wallet.
-   **Property Marketplace:** View all properties currently listed for sale, along with their location and price.
-   **Buy Property:** Purchase any listed property directly. The transaction is handled by the smart contract, ensuring the funds are transferred to the seller and ownership is transferred to the buyer simultaneously.
-   **Personal Portfolio:** View and manage all properties you currently own.
-   **List for Sale:** Set a price and list any property you own on the marketplace for others to buy.
-   **Transaction Ledger:** A transparent, on-chain ledger showing a history of all property sales that have occurred on the platform.

---

## Technology Stack

-   **Frontend:** React (Vite) with Tailwind CSS for styling.
-   **Blockchain Interaction:** `ethers.js` library to communicate with the Ethereum network.
-   **Smart Contract:** Written in Solidity and developed using the Hardhat environment.
-   **Local Blockchain:** The project is configured to run on a local Hardhat node for development and testing.

---

## How to Run This Project Locally

Follow these steps to set up and run the project on your local machine.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v16 or later)
-   [Git](https://git-scm.com/)
-   [MetaMask](https://metamask.io/) browser extension

### 1. Clone & Install Dependencies

Clone the repository and install the necessary packages.

```bash
git clone [YOUR_GITHUB_REPOSITORY_URL]
cd blockchain-property-marketplace
npm install

Then, navigate into the frontend directory and install its dependencies.

cd react-frontend
npm install
cd .. 

2. Start the Local Blockchain
Open a terminal and run the Hardhat local node.

npx hardhat node

3. Deploy the Smart Contract
Open a second terminal and run the deployment script. This will also seed the marketplace with 10 sample properties.

npx hardhat run scripts/deploy.js --network localhost

Important: Copy the deployed contract address that is logged in the terminal.

4. Configure the Frontend
Open the react-frontend/src/App.jsx file.

Find the contractAddress constant and paste the address you copied from the deployment step.

5. Run the Frontend Application
Open a third terminal, navigate to the react-frontend directory, and start the app.

cd react-frontend
npm run dev

Open your browser to http://localhost:5173 to view the application.

6. Configure MetaMask
Add the "Hardhat Local" network to MetaMask with RPC URL http://127.0.0.1:8545 and Chain ID 31337.

Import test accounts from the Hardhat node into MetaMask using their private keys to act as buyers and sellers.


### **2. Git Ignore File (`.gitignore`)**

This file tells Git which files and folders to ignore. It is **essential** for preventing the massive `node_modules` folder and other unnecessary files from being uploaded. **Create a new file named `.gitignore` in the root of your `blockchain-property-marketplace` folder and paste the content below into it.**


See https://help.github.com/articles/ignoring-files/ for more about ignoring files.
dependencies
/node_modules
/.pnp
.pnp.js

testing
/coverage

production
/build
/dist

misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*

Hardhat
/artifacts
/cache
hardhat.config.js.bak
/