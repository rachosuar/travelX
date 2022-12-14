// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./NFTickets.sol";

/// @notice Contract for Transfering an NFT Ticket 
/// @dev RachoSuar - TinchoMon
contract TicketsMarketplace is Ownable {
    event nftTransfer(address _from, address _to, uint256 id, uint256 timestamp);

    NFTickets nfTickets;
    IERC20 USDCToken;


    constructor (address _erc20,address _erc721) {
        nfTickets = NFTickets(_erc721);
        USDCToken  =  IERC20(_erc20);

    }

    function create(uint256 timestamp, uint256 price) public onlyOwner{
        nfTickets.createTicket(timestamp, price);
    }
   
    /// @notice set price for selling NFT Ticket - If price is 0 is not for sale
    /// @dev RachoSuar - TinchoMon
    /// @param tokenID id of the NFT Ticket
    /// @param amount price set for the NFT
    function sellTicket(uint256 tokenID, uint256 amount) public {
        require(nfTickets.ownerOf(tokenID) == msg.sender, "You are not the owner of this ticket");
        require(block.timestamp <= nfTickets.getDeadline(tokenID), "You can not sell this ticket. Deadline expired");
        nfTickets.setPrice(tokenID,amount) ;
       
    }


    /// @notice Transfer NFT Ticket
    /// @dev RachoSuar - TinchoMon
    /// @param tokenID id of the NFT Ticket
    /// @param _to address of the new owner of the NFT (can not be the same address that buys)
    
    function transferNFT(uint256 tokenID, address _to) public {
        //require(curreny == usdc, "wrong token");
        require(nfTickets.getPrice(tokenID) > 0, "This ticket is not for sale");
        require(block.timestamp <= nfTickets.getDeadline(tokenID), "You can not buy this ticket. Deadline expired");
        require(USDCToken.balanceOf(msg.sender)>=nfTickets.getPrice(tokenID),"Unsufficient founds on the account");
        
        
        //USDCToken.approve(address(this), nftPrice[tokenID]);
        USDCToken.transferFrom(msg.sender, nfTickets.ownerOf(tokenID),nfTickets.getPrice(tokenID)*95/100);
        //USDCToken.transferFrom(msg.sender, contrato splitter,nftPrice[tokenID]*5/100);

       // require(_isApprovedOrOwner(_msgSender(), tokenID) || ownerOf(tokenID) == address(this), "ERC721: caller is not token owner or approved");
        nfTickets.safeTransferFrom(nfTickets.ownerOf(tokenID), _to, tokenID, "");
        emit nftTransfer(nfTickets.ownerOf(tokenID), _to, tokenID, block.timestamp);
    }


     

}
