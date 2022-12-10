// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Contract to create mock NFTTickets for practice

contract NFTtrade is ERC721Royalty, Ownable{
address travelx; 
address airline;
    constructor(address _travelX, address _airline) ERC721 ("TravelX", "TVX"){

        travelx = _travelX;
        airline= _airline;

    }


/// @dev Create tickets and sends it to travelX addres
/// @param _data sends timestamp of 72hs befor travel date.

function createTicket (uint8 _data) onlyOwner public view {
    require(_data >= block.timestamp);
    uint256 deadline = _data;
    uint256 tokenId=totalSupply;
    _mint(travelX,tokenId,deadline) 


} 

function _feeDenominator();

}