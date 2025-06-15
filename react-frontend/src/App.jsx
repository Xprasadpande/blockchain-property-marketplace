import React, { useState, useEffect, useCallback } from 'react';
// Ethers.js is loaded dynamically via a script tag, so no import is needed here.
import { Home, User, ShoppingCart, BookOpen, Building, CheckCircle, AlertTriangle, WifiOff } from 'lucide-react';

// --- CONTRACT DETAILS ---
// This address MUST be the one from your SEPOLIA deployment.
const contractAddress = "0x71bE63f3384f5fb98995898A86B02Fb2426c5788"; // IMPORTANT: Replace this address!
const contractABI = [
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "propertyId", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "seller", "type": "address" } ], "name": "PropertyListed", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "propertyId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": false, "internalType": "string", "name": "location", "type": "string" } ], "name": "PropertyRegistered", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "propertyId", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "seller", "type": "address" }, { "indexed": true, "internalType": "address", "name": "buyer", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" } ], "name": "PropertySold", "type": "event" }, { "inputs": [ { "internalType": "uint256", "name": "_propertyId", "type": "uint256" } ], "name": "buyProperty", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "_propertyId", "type": "uint256" }, { "internalType": "uint256", "name": "_price", "type": "uint256" } ], "name": "listProperty", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "properties", "outputs": [ { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "string", "name": "ownerName", "type": "string" }, { "internalType": "string", "name": "location", "type": "string" }, { "internalType": "string", "name": "documentHash", "type": "string" }, { "internalType": "uint256", "name": "price", "type": "uint256" }, { "internalType": "bool", "name": "isForSale", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "propertyCounter", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "string", "name": "_ownerName", "type": "string" }, { "internalType": "string", "name": "_location", "type": "string" }, { "internalType": "string", "name": "_documentHash", "type": "string" } ], "name": "registerProperty", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" }
];
// This is the Chain ID for the public Sepolia Test Network.
const SEPOLIA_NETWORK_ID = '11155111';

const App = () => {
    const [ethersLoaded, setEthersLoaded] = useState(false);
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [view, setView] = useState('marketplace'); 
    const [properties, setProperties] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [networkError, setNetworkError] = useState(false);
    
    // Dynamically load Ethers.js from a CDN
    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js";
        script.async = true;
        script.onload = () => {
            console.log("Ethers.js loaded");
            setEthersLoaded(true);
        };
        script.onerror = () => showNotification("Failed to load blockchain library.", "error");
        document.body.appendChild(script);
        return () => { document.body.removeChild(script); };
    }, []);

    const checkNetwork = async () => {
        try {
            if (!window.ethereum) return false;
            const provider = new window.ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();
            if (network.chainId.toString() !== SEPOLIA_NETWORK_ID) {
                setNetworkError(true);
                setAccount(null);
                return false;
            }
            setNetworkError(false);
            return true;
        } catch (error) {
            setNetworkError(true);
            return false;
        }
    };

    const connectWallet = async () => {
        try {
            if (!window.ethereum) throw new Error("MetaMask is not installed.");
            const isCorrectNetwork = await checkNetwork();
            if (!isCorrectNetwork) return;

            const provider = new window.ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            const contractInstance = new window.ethers.Contract(contractAddress, contractABI, signer);
            
            setAccount(address);
            setContract(contractInstance);
            showNotification('Wallet connected successfully!', 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    const fetchData = useCallback(async () => {
        if (!contract) return;
        setLoading(true);
        try {
            const propertyCountBigInt = await contract.propertyCounter();
            const propertyCount = Number(propertyCountBigInt);
            const fetchedProperties = [];
            for (let i = 0; i < propertyCount; i++) {
                const p = await contract.properties(i);
                if (p.owner !== window.ethers.constants.AddressZero) {
                    fetchedProperties.push({
                        id: i, owner: p.owner, ownerName: p.ownerName, location: p.location,
                        price: window.ethers.utils.formatEther(p.price), isForSale: p.isForSale,
                    });
                }
            }
            setProperties(fetchedProperties);

            const soldEvents = await contract.queryFilter('PropertySold');
            const formattedTxns = soldEvents.map(e => ({
                propertyId: Number(e.args.propertyId), price: window.ethers.utils.formatEther(e.args.price),
                seller: e.args.seller, buyer: e.args.buyer,
                timestamp: new Date(Number(e.args.timestamp) * 1000).toLocaleString(),
                txHash: e.transactionHash
            })).reverse();
            setTransactions(formattedTxns);
        } catch (error) {
            console.error("Fetch Data Error:", error);
            showNotification('Failed to fetch on-chain data.', 'error');
        }
        setLoading(false);
    }, [contract]);

    useEffect(() => {
        if (ethersLoaded) {
            checkNetwork();
            if (window.ethereum) {
                window.ethereum.on('chainChanged', () => window.location.reload());
                window.ethereum.on('accountsChanged', () => checkNetwork().then(ok => ok && connectWallet()));
            }
        }
    }, [ethersLoaded]);
    
    useEffect(() => {
        if (contract) {
            fetchData();
        }
    }, [contract, fetchData]);


    // --- UI and other functions remain the same ---
    const showNotification = (message, type) => { setNotification({ show: true, message, type }); setTimeout(() => { setNotification({ show: false, message: '', type: '' }); }, 5000); };
    const handleBuy = async (property) => { if (!contract) return; setLoading(true); showNotification('Processing purchase...', 'info'); try { const priceInWei = window.ethers.utils.parseEther(property.price.toString()); const tx = await contract.buyProperty(property.id, { value: priceInWei }); await tx.wait(); showNotification('Purchase successful!', 'success'); fetchData(); } catch (error) { showNotification(error.reason || 'Purchase failed.', 'error'); } setLoading(false); };
    const handleList = async (e, propertyId) => { e.preventDefault(); if (!contract) return; const price = e.target.price.value; if (!price || parseFloat(price) <= 0) return showNotification("Please enter a valid price.", 'error'); setLoading(true); showNotification('Listing property...', 'info'); try { const priceInWei = window.ethers.utils.parseEther(price); const tx = await contract.listProperty(propertyId, priceInWei); await tx.wait(); showNotification('Property listed for sale!', 'success'); fetchData(); } catch (error) { showNotification(error.reason || 'Listing failed.', 'error'); } setLoading(false); };
    const Notification = ({ message, type, show }) => { if (!show) return null; const styles = { success: 'bg-green-100 border-green-400 text-green-700', error: 'bg-red-100 border-red-400 text-red-700', info: 'bg-blue-100 border-blue-400 text-blue-700' }; const Icon = { success: CheckCircle, error: AlertTriangle, info: Building }[type]; return ( <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg border shadow-lg flex items-center animate-fade-in-down ${styles[type]}`}> <Icon className="mr-3" /> <span>{message}</span> </div> ); };
    const EthersLoadingView = () => ( <div className="w-full min-h-screen flex items-center justify-center bg-gray-50 p-4"> <div className="flex flex-col items-center justify-center"> <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> <p className="mt-4 text-gray-600 font-semibold">Loading Blockchain Library...</p> </div> </div> );
    const HomeView = () => ( <div className="w-full min-h-screen flex items-center justify-center bg-gray-50 p-4"> <div className="text-center"> <Building className="mx-auto h-16 w-16 text-cyan-600" /> <h1 className="mt-6 text-4xl md:text-5xl font-bold text-gray-800">Chain Estates</h1> <p className="mt-4 text-lg text-gray-600">A decentralized real estate marketplace built on the blockchain.</p> {networkError ? ( <div className="mt-10 px-8 py-3 bg-red-100 text-red-700 font-semibold rounded-lg shadow-md flex items-center gap-4"> <WifiOff /> <div> <p>Wrong Network Detected</p> <p className="text-sm font-normal">Please connect MetaMask to the Sepolia network.</p> </div> </div> ) : ( <button onClick={connectWallet} className="mt-10 px-8 py-3 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 transform hover:scale-105"> Connect Wallet to Get Started </button> )} </div> </div> );
    const AppShell = () => ( <div className="min-h-screen bg-gray-100"> <Notification {...notification} /> <header className="bg-white shadow-sm sticky top-0 z-40"> <div className="container mx-auto px-4 sm:px-6 lg:px-8"> <div className="flex justify-between items-center py-4"> <div className="flex items-center gap-3"> <Building className="h-8 w-8 text-cyan-600" /> <h1 className="text-2xl font-bold text-gray-800">Chain Estates</h1> </div> <div className="text-sm font-semibold bg-gray-100 text-gray-700 px-4 py-2 rounded-full"> {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`} </div> </div> </div> </header> <nav className="bg-white border-b border-gray-200"> <div className="container mx-auto px-4 sm:px-6 lg:px-8"> <div className="flex justify-center -mb-px"> <NavButton id="marketplace" text="Marketplace" icon={<ShoppingCart />} /> <NavButton id="my-properties" text="My Properties" icon={<Home />} /> <NavButton id="ledger" text="Transaction Ledger" icon={<BookOpen />} /> </div> </div> </nav> <main className="py-10"> <div className="container mx-auto px-4 sm:px-6 lg:px-8"> {loading ? <LoadingSpinner /> : <CurrentView />} </div> </main> </div> );
    const NavButton = ({ id, text, icon }) => ( <button onClick={() => setView(id)} className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-colors duration-200 border-b-2 ${ view === id ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' }`}> {icon} {text} </button> );
    const CurrentView = () => { const myProperties = properties.filter(p => p.owner.toLowerCase() === account?.toLowerCase()); const marketplaceProperties = properties.filter(p => p.isForSale); switch(view) { case 'marketplace': return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"> {marketplaceProperties.length > 0 ? marketplaceProperties.map(p => ( <PropertyCard key={p.id} property={p}> {p.owner.toLowerCase() !== account?.toLowerCase() && ( <ActionButton onClick={() => handleBuy(p)} text="Buy Now" color="green" /> )} </PropertyCard> )) : <p className="col-span-full text-center py-10 text-gray-500">No properties are currently for sale.</p>} </div>; case 'my-properties': return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"> {myProperties.length > 0 ? myProperties.map(p => ( <PropertyCard key={p.id} property={p}> {!p.isForSale ? ( <form onSubmit={(e) => handleList(e, p.id)} className="flex gap-2 items-center"> <input name="price" type="number" step="0.01" min="0.01" placeholder="Price (ETH)" className="flex-grow bg-gray-100 border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:ring-cyan-500 focus:border-cyan-500" /> <ActionButton text="List" type="submit" color="blue" /> </form> ) : <div className="w-full text-center py-2 bg-gray-200 text-gray-600 font-semibold rounded-lg text-sm">Listed for Sale</div>} </PropertyCard> )) : <p className="col-span-full text-center py-10 text-gray-500">You do not own any properties.</p>} </div>; case 'ledger': return <LedgerTable txns={transactions} />; default: return null; } };
    const PropertyCard = ({ property, children }) => ( <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition-all hover:shadow-xl hover:-translate-y-1"> <div className="h-40 bg-cyan-500 flex items-center justify-center"> <h2 className="text-white text-lg font-bold px-4 text-center">{property.location.split(',')[0]}</h2> </div> <div className="p-5"> <p className="text-xs text-gray-500 mb-2">{property.location}</p> <p className="text-xs text-gray-500">Owned by: <span className="font-mono text-gray-600">{property.ownerName}</span></p> {property.isForSale && ( <div className="mt-4"> <p className="text-2xl font-bold text-gray-800">{property.price} ETH</p> </div> )} <div className="mt-5">{children}</div> </div> </div> );
    const LedgerTable = ({ txns }) => ( <div className="bg-white rounded-lg shadow-md overflow-hidden"> <table className="min-w-full divide-y divide-gray-200"> <thead className="bg-gray-50"> <tr> <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th> <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th> <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller → Buyer</th> <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th> <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th> </tr> </thead> <tbody className="bg-white divide-y divide-gray-200"> {txns.map((tx, i) => ( <tr key={i}> <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.timestamp}</td> <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">#{tx.propertyId}</td> <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono"> <span className="text-red-600">{tx.seller.substring(0,6)}...</span> → <span className="text-green-600">{tx.buyer.substring(0,6)}...</span> </td> <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-bold text-right">{tx.price} ETH</td> <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"> <a href={`https://sepolia.etherscan.io/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:text-cyan-800">View</a> </td> </tr> ))} </tbody> </table> </div> );
    const ActionButton = ({ onClick, text, color, type = 'button' }) => { const colorStyles = { green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500', blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500', }; return ( <button type={type} onClick={onClick} className={`w-full px-4 py-2 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${colorStyles[color]}`}> {text} </button> ); };
    const LoadingSpinner = () => ( <div className="flex flex-col items-center justify-center p-20"> <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> <p className="mt-4 text-gray-600 font-semibold">Loading On-Chain Data...</p> </div> );
    
    if (!ethersLoaded) { return <EthersLoadingView />; }
    if (!account) { return <HomeView />; }
    return <AppShell />;
}

export default App;
