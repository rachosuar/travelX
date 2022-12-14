// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTickets is Ownable, ERC721Royalty {

    
    address splitter;

  
    
    constructor(address _splitter) ERC721("TravelX", "TVX") {
        splitter = _splitter;

        ////@dev Sets the royalty information for all NFTs.
        _setDefaultRoyalty(splitter, 5000);
    }
     event TicketCreated(uint256 _id, uint256 price, uint256 timestamp);
      /// @notice Counter of NFT Tickets minted
    uint256 totalSupply = 0;

    /// @notice Deadline timestamp for transfer deadline for each NFT.
    mapping(uint256 => uint256) public nftDeadlineTransfer;

    /// @notice Price for each NFT Ticket
    mapping(uint256 => uint256) public nftPrice;

   

    /// @notice create NFTTickets initiali as a Mock, to be confirmed by travelX
    /// @dev RachoSuar - TinchoMon
    /// @param timestamp timestamp of deadline for trading
    /// @param price sets initial price for the ticket
    function createTicket(uint256 timestamp, uint256 price) external onlyOwner {
        _mint(msg.sender, totalSupply);
        nftDeadlineTransfer[totalSupply] = timestamp;
        nftPrice[totalSupply] = price;

        emit TicketCreated(totalSupply, price, timestamp);
        //approve(address(this), totalSupply);
        totalSupply += 1;
    }

    function setPrice(uint256 id, uint256 amount) public  {
        require(nftDeadlineTransfer[id]>0,"Ticket doesn't exist");
        require (ownerOf(id)== tx.origin);
        nftPrice[id]=amount;
    } 
    function getPrice (uint256 id) public view returns(uint256 price){
        return nftPrice[id];
    }

    function getDeadline (uint256 id) public view returns(uint256 deadline){
        return nftDeadlineTransfer[id];
    }

    function isOnSale(uint256 id) public view returns (bool){
        return nftPrice[id]>0 && nftDeadlineTransfer[id]>block.timestamp;
    }

    

       function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenID, /* firstTokenId */
        uint256 batchSize
    ) internal virtual override {
        require(batchSize == 1, "Incorrect batch size");
        NFTickets.nftPrice[firstTokenID] = 0; // Vuelvo el precio a 0 para que no quede en venta
        super._beforeTokenTransfer(from,to,firstTokenID, batchSize);
    }
}
