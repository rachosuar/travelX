// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTTickets is Ownable, ERC721Royalty {

    //set Airline and TravelX addresses
    address splitter;

    /// @notice Counter of NFT Tickets minted
    uint256 totalSupply = 0;

    /// @notice Deadline timestamp for transfer deadline for each NFT.
    mapping(uint256 => uint256) public nftDeadlineTransfer;

    /// @notice Price for each NFT Ticket
    mapping(uint256 => uint256) public nftPrice;
    
    constructor(address _splitter) ERC721("TravelX", "TVX") {
        splitter = _splitter;

        ////@dev Sets the royalty information for all NFTs.
        _setDefaultRoyalty(splitter, 5000);
    }

    event TicketCreated(uint256 _id, uint256 price, uint256 timestamp);

    /// @notice create NFTTickets initiali as a Mock, to be confirmed by travelX
    /// @dev RachoSuar - TinchoMon
    /// @param timestamp timestamp of deadline for trading
    /// @param price sets initial price for the ticket
    function createTicket(uint256 timestamp, uint256 price) public onlyOwner {
        _mint(address(this), totalSupply);
        nftDeadlineTransfer[totalSupply] = timestamp;
        nftPrice[totalSupply] = price;

        emit TicketCreated(totalSupply, price, timestamp);
        //approve(address(this), totalSupply);
        totalSupply += 1;
    }
}
