// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "hardhat/console.sol";

contract PropertyRegistry {
    struct Property {
        address owner;
        string ownerName;
        string location;
        string documentHash;
        uint256 price;
        bool isForSale;
    }

    uint256 public propertyCounter;
    mapping(uint256 => Property) public properties;

    event PropertyRegistered(
        uint256 indexed propertyId,
        address indexed owner,
        string location
    );

    event PropertyListed(
        uint256 indexed propertyId,
        uint256 price,
        address indexed seller
    );
    
    event PropertySold(
        uint256 indexed propertyId,
        uint256 price,
        address indexed seller,
        address indexed buyer,
        uint256 timestamp
    );

    function registerProperty(
        string memory _ownerName,
        string memory _location,
        string memory _documentHash
    ) public returns (uint256) {
        uint256 newPropertyId = propertyCounter;
        properties[newPropertyId] = Property({
            owner: msg.sender,
            ownerName: _ownerName,
            location: _location,
            documentHash: _documentHash,
            price: 0,
            isForSale: false
        });

        propertyCounter++; // Increment the counter for the next property
        emit PropertyRegistered(newPropertyId, msg.sender, _location);
        return newPropertyId;
    }

    function listProperty(uint256 _propertyId, uint256 _price) public {
        require(properties[_propertyId].owner == msg.sender, "You are not the owner");
        require(_price > 0, "Price must be greater than 0");
        
        properties[_propertyId].price = _price;
        properties[_propertyId].isForSale = true;

        emit PropertyListed(_propertyId, _price, msg.sender);
    }

    function buyProperty(uint256 _propertyId) public payable {
        Property storage propertyToBuy = properties[_propertyId];
        require(propertyToBuy.owner != address(0), "Property does not exist");
        require(propertyToBuy.isForSale, "Property is not for sale");
        require(msg.value >= propertyToBuy.price, "Insufficient funds provided");
        require(propertyToBuy.owner != msg.sender, "You cannot buy your own property");

        address seller = propertyToBuy.owner;
        uint256 price = propertyToBuy.price;

        propertyToBuy.owner = msg.sender;
        propertyToBuy.isForSale = false;

        emit PropertySold(_propertyId, price, seller, msg.sender, block.timestamp);
        
        (bool success, ) = seller.call{value: price}("");
        require(success, "Failed to transfer funds to seller");
    }
}