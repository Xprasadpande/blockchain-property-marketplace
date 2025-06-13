const hre = require("hardhat");

async function main() {
    const [owner, buyer1, buyer2, buyer3] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", owner.address);

    const propertyRegistry = await hre.ethers.deployContract("PropertyRegistry");
    await propertyRegistry.waitForDeployment();
    console.log(`PropertyRegistry deployed to: ${propertyRegistry.target}`);

    console.log("\nSeeding blockchain with sample data...");

    const locations = [
        "123 Maple St, Springfield", "456 Oak Ave, Shelbyville", "789 Pine Ln, Capital City", 
        "101 Elm Ct, Ogdenville", "212 Birch Rd, North Haverbrook", "333 Cedar Blvd, Brockway",
        "444 Spruce Dr, Cypress Creek", "555 Willow Way, Little Pwagmattasquarmsetticutt", 
        "666 Redwood Pl, The Old Country", "777 Sequoia Ave, New New York",
    ];
    const owners = [owner, buyer1, buyer2, buyer3, owner, buyer1, buyer2, buyer3, owner, buyer1];
    const ownerNames = ["Alice", "Bob", "Charlie", "Diana", "Alice", "Bob", "Charlie", "Diana", "Alice", "Bob"];

    for (let i = 0; i < 10; i++) {
        const tx = await propertyRegistry.connect(owners[i]).registerProperty(
            ownerNames[i], locations[i], `Qm...mockhash...${i}`
        );
        await tx.wait();
        console.log(`Registered property ${i} for ${ownerNames[i]}`);
    }
    
    console.log("\nListing some properties for sale...");
    
    const price1 = hre.ethers.parseEther("1.5");
    await propertyRegistry.connect(buyer1).listProperty(1, price1);
    console.log(`Listed Property #1 for 1.5 ETH`);

    const price2 = hre.ethers.parseEther("5");
    await propertyRegistry.connect(buyer2).listProperty(2, price2);
    console.log(`Listed Property #2 for 5.0 ETH`);

    const price4 = hre.ethers.parseEther("12");
    await propertyRegistry.connect(owner).listProperty(4, price4);
    console.log(`Listed Property #4 for 12.0 ETH`);

    console.log("\nFinished seeding data!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});