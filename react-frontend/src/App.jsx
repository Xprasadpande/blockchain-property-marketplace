import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Home, User, ShoppingCart, BookOpen, WifiOff } from 'lucide-react';

// --- CONTRACT DETAILS ---
// This address will be verified and replaced in the steps below.
const contractAddress = "0x71bE63f3384f5fb98995898A86B02Fb2426c5788";
const contractABI = [
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "propertyId", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "seller", "type": "address" } ], "name": "PropertyListed", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "propertyId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": false, "internalType": "string", "name": "location", "type": "string" } ], "name": "PropertyRegistered", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "propertyId", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "seller", "type": "address" }, { "indexed": true, "internalType": "address", "name": "buyer", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" } ], "name": "PropertySold", "type": "event" }, { "inputs": [ { "internalType": "uint256", "name": "_propertyId", "type": "uint256" } ], "name": "buyProperty", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "_propertyId", "type": "uint256" }, { "internalType": "uint256", "name": "_price", "type": "uint256" } ], "name": "listProperty", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "properties", "outputs": [ { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "string", "name": "ownerName", "type": "string" }, { "internalType": "string", "name": "location", "type": "string" }, { "internalType": "string", "name": "documentHash", "type": "string" }, { "internalType": "uint256", "name": "price", "type": "uint256" }, { "internalType": "bool", "name": "isForSale", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "propertyCounter", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "string", "name": "_ownerName", "type": "string" }, { "internalType": "string", "name": "_location", "type": "string" }, { "internalType": "string", "name": "_documentHash", "type": "string" } ], "name": "registerProperty", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" }
];
const HARDHAT_NETWORK_ID = '31337';

const App = () => {
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [view, setView] = useState('home');
    const [properties, setProperties] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [networkError, setNetworkError] = useState(false);

    const checkNetwork = async () => {
        try {
            if (window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const network = await provider.getNetwork();
                if (network.chainId.toString() !== HARDHAT_NETWORK_ID) {
                    setNetworkError(true);
                    return false;
                }
                setNetworkError(false);
                return true;
            }
        } catch (error) {
            console.error("Could not check network:", error);
            setNetworkError(true);
            return false;
        }
    };

    const connectWallet = async () => {
        try {
            if (!window.ethereum) throw new Error("MetaMask not found");
            const isCorrectNetwork = await checkNetwork();
            if (!isCorrectNetwork) return;

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
            const accounts = await provider.send("eth_requestAccounts", []);
            setAccount(accounts[0]);
            setContract(contractInstance);
            setView('marketplace'); 
        } catch (error) {
            console.error("Connection failed:", error);
        }
    };

    const fetchData = useCallback(async () => {
        if (!contract) return;
        const isCorrectNetwork = await checkNetwork();
        if (!isCorrectNetwork) return;
        
        setLoading(true);
        try {
            const propertyCountBigInt = await contract.propertyCounter();
            const propertyCount = Number(propertyCountBigInt);
            
            const fetchedProperties = [];
            for (let i = 0; i < propertyCount; i++) {
                const p = await contract.properties(i);
                if (p.owner !== ethers.ZeroAddress) {
                    fetchedProperties.push({
                        id: i, owner: p.owner, ownerName: p.ownerName,
                        location: p.location, price: ethers.formatEther(p.price), isForSale: p.isForSale,
                    });
                }
            }
            setProperties(fetchedProperties);

            const soldEvents = await contract.queryFilter('PropertySold');
            const formattedTxns = soldEvents.map(e => ({
                propertyId: Number(e.args.propertyId), price: ethers.formatEther(e.args.price),
                seller: e.args.seller, buyer: e.args.buyer,
                timestamp: new Date(Number(e.args.timestamp) * 1000).toLocaleString(),
            })).reverse();
            setTransactions(formattedTxns);

        } catch (error) {
            console.error("Failed to fetch data:", error);
            alert(`Failed to fetch on-chain data. Please follow the debug steps. Error: ${error.message}`);
        }
        setLoading(false);
    }, [contract]);

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
            window.ethereum.on('accountsChanged', () => {
                window.location.reload();
            });
        }
        if (account && contract) {
            fetchData();
        }
    }, [account, contract, fetchData]);

    // --- UI Components and Handlers... same as before ---
    // The rest of the App.jsx file remains the same. The logic below is not changed.

    const handleBuy = async (property) => {
        if (!contract) return;
        setLoading(true);
        try {
            const priceInWei = ethers.parseEther(property.price.toString());
            const tx = await contract.buyProperty(property.id, { value: priceInWei });
            await tx.wait();
            alert("Purchase successful!");
            fetchData();
        } catch(error) {
            console.error("Purchase failed:", error);
            alert(`Purchase failed: ${error.reason || error.message}`);
        }
        setLoading(false);
    };

    const handleList = async (e, propertyId) => {
        e.preventDefault();
        if (!contract) return;
        const price = e.target.price.value;
        if (!price || parseFloat(price) <= 0) return alert("Please enter a valid price.");
        setLoading(true);
        try {
            const priceInWei = ethers.parseEther(price);
            const tx = await contract.listProperty(propertyId, priceInWei);
            await tx.wait();
            alert("Property listed for sale!");
            fetchData();
        } catch(error) {
            console.error("Listing failed:", error);
            alert(`Listing failed: ${error.reason || error.message}`);
        }
        setLoading(false);
    };
    
    const Header = () => (
        <header className="bg-gray-800/80 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-50 border-b border-gray-700">
            <h1 className="text-xl md:text-2xl font-bold text-cyan-400 cursor-pointer" onClick={() => setView('marketplace')}>Chain Estates</h1>
            <div className="text-right">
                <p className="font-mono text-sm">{`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}</p>
                <p className="text-xs text-gray-400">Connected</p>
            </div>
        </header>
    );

    const Nav = () => (
        <nav className="p-4 bg-gray-800/50">
            <div className="container mx-auto flex justify-center items-center gap-4 md:gap-8">
                <NavButton id="marketplace" icon={<ShoppingCart />} text="Marketplace" />
                <NavButton id="my-properties" icon={<Home />} text="My Properties" />
                <NavButton id="ledger" icon={<BookOpen />} text="Ledger" />
            </div>
        </nav>
    );

    const NavButton = ({ id, icon, text }) => (
        <button onClick={() => setView(id)} className={`flex items-center gap-2 px-4 py-2 font-semibold transition-colors duration-200 rounded-lg ${view === id ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
            {icon} <span className="hidden md:inline">{text}</span>
        </button>
    );

    const PropertyCard = ({ property, children }) => (
        <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 flex flex-col transition-transform hover:scale-105">
            <div className="p-5 flex-grow">
                <p className="text-sm text-gray-400">Property ID: {property.id}</p>
                <h3 className="text-xl font-bold mt-1 text-white">{property.location}</h3>
                <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Owner</span>
                        <span className="font-mono text-cyan-300">{property.ownerName} ({`${property.owner.substring(0, 5)}...`})</span>
                    </div>
                    {property.isForSale && (
                         <div className="flex justify-between items-center">
                            <span className="text-gray-400">Price</span>
                            <span className="font-bold text-lg text-green-400">{property.price} ETH</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="bg-gray-800/50 px-5 pb-4">
                {children}
            </div>
        </div>
    );
    
    const HomeView = () => (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-center p-4" style={{background: 'radial-gradient(circle, rgba(20,49,60,1) 0%, rgba(17,24,39,1) 100%)'}}>
            <h1 className="text-5xl md:text-7xl font-bold text-white">Chain Estates</h1>
            <p className="mt-4 text-xl text-cyan-300">The Future of Real Estate, Secured by the Blockchain.</p>
            {networkError ? (
                <div className="mt-12 px-8 py-4 bg-red-800 text-white font-bold text-lg rounded-lg flex items-center gap-4">
                    <WifiOff />
                    <div>
                        <p>Wrong Network Detected</p>
                        <p className="text-sm font-normal">Please connect MetaMask to the Hardhat Local network.</p>
                    </div>
                </div>
            ) : (
                 <button onClick={connectWallet} className="mt-12 px-8 py-4 bg-cyan-600 text-white font-bold text-lg rounded-lg hover:bg-cyan-500 transition-all duration-300 shadow-lg hover:shadow-cyan-400/40">
                    Connect with MetaMask
                </button>
            )}
        </div>
    );

    const AppView = () => {
        const myProperties = properties.filter(p => p.owner.toLowerCase() === account?.toLowerCase());
        const marketplaceProperties = properties.filter(p => p.isForSale);
        
        return (
            <div className="min-h-screen bg-gray-900">
                <Header />
                <Nav />
                <main className="container mx-auto p-4 md:p-8">
                    {loading && <div className="text-center p-10 font-bold text-lg">Loading On-Chain Data...</div>}
                    {!loading && view === 'marketplace' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {marketplaceProperties.length > 0 ? marketplaceProperties.map(p => (
                               <PropertyCard key={p.id} property={p}>
                                   {p.owner.toLowerCase() !== account?.toLowerCase() && (<button onClick={() => handleBuy(p)} className="w-full mt-4 py-2 bg-green-600 rounded-lg hover:bg-green-500 font-bold flex items-center justify-center"><ShoppingCart className="mr-2" size={18}/> Buy Now</button>)}
                               </PropertyCard>
                            )) : <p className="col-span-full text-center py-10">No properties currently for sale.</p>}
                        </div>
                    )}
                    {!loading && view === 'my-properties' && (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                           {myProperties.length > 0 ? myProperties.map(p => (
                               <PropertyCard key={p.id} property={p}>
                                   {!p.isForSale ? (<form onSubmit={(e) => handleList(e, p.id)} className="mt-4 flex gap-2"><input name="price" type="number" step="0.01" placeholder="Price in ETH" className="flex-grow bg-gray-700 rounded-md px-2 py-1 text-sm w-full" /><button type="submit" className="px-3 py-1 bg-blue-600 rounded-md hover:bg-blue-500 font-semibold text-sm">List</button></form>) : <div className="mt-4 text-center py-2 bg-gray-700 rounded-lg font-bold text-green-400">Listed for Sale</div>}
                               </PropertyCard>
                           )) : <p className="col-span-full text-center py-10">You do not own any properties.</p>}
                        </div>
                    )}
                     {!loading && view === 'ledger' && (
                        <div className="bg-gray-800 rounded-xl p-4 md:p-6 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead><tr className="border-b-2 border-gray-700"><th className="p-3 text-sm font-semibold text-gray-400">Timestamp</th><th className="p-3 text-sm font-semibold text-gray-400">Property ID</th><th className="p-3 text-sm font-semibold text-gray-400">From (Seller)</th><th className="p-3 text-sm font-semibold text-gray-400">To (Buyer)</th><th className="p-3 text-sm font-semibold text-gray-400 text-right">Price</th></tr></thead>
                                <tbody>
                                    {transactions.map((tx, i) => (<tr key={i} className="border-b border-gray-700/50"><td className="p-3 text-sm">{tx.timestamp}</td><td className="p-3 text-sm font-bold">#{tx.propertyId}</td><td className="p-3 text-sm font-mono text-red-400">{`${tx.seller.substring(0,10)}...`}</td><td className="p-3 text-sm font-mono text-green-400">{`${tx.buyer.substring(0,10)}...`}</td><td className="p-3 text-sm font-bold text-right">{tx.price} ETH</td></tr>))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>
        );
    };

    if (!account) {
        return <HomeView />;
    } else {
        return <AppView />;
    }
}

export default App;