// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Contract to create mock NFTTickets for practice

contract NFTCreator is ERC721Royalty, Ownable {

address travelx; 
address airline;
address splitter;

    constructor(address _travelX, address _airline, address _splitter) ERC721 ("TravelX", "TVX"){
        travelx = _travelX;
        airline= _airline;
        splitter= _splitter;

 ////@dev Sets the royalty information for all NFTs.

    _setDefaultRoyalty(splitter, 5000) ; 
    }

     
}