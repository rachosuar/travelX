// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "./AirlineTickets.sol";

/// @notice Contract for Transfering an NFT Ticket 
/// @dev RachoSuar - TinchoMon
contract NFTtrade {
    event nftTransfer(address _from, address _to, uint256 id, uint256 timestamp);

    // state variables

    //set Airline and TravelX addresses

    /// @notice Deadline timestamp for transfer deadline for each NFT.
    mapping (uint256 => uint256) public nftDeadlineTransfer;

    /// @notice Price for each NFT Ticket
    mapping (uint256 => uint256) public nftPrice;

    /// @notice set price for selling NFT Ticket - If price is 0 is not for sale
    /// @dev RachoSuar - TinchoMon
    /// @param tokenID id of the NFT Ticket
    /// @param amount price set for the NFT
    function sellTicket(uint256 tokenID, uint256 amount) public {
        require(ownerOf(tokenID) == msg.sender, "You are not the owner of this ticket");
        require(block.timestamp <= nftDeadlineTransfer[tokenID], "You can not sell this ticket. Deadline expired");
        nftPrice[tokenID] = amount;
    }


    /// @notice Transfer NFT Ticket
    /// @dev RachoSuar - TinchoMon
    /// @param tokenID id of the NFT Ticket
    /// @param _to address of the new owner of the NFT (can not be the same address that buys)
    
    function transferNFT(uint256 tokenID, address _to) public payable {
        require(nftPrice[tokenID] > 0, "This ticket is not for sale");
        require(block.timestamp <= nftDeadlineTransfer[tokenID], "You can not buy this ticket. Deadline expired");
        nftPrice[tokenID] = 0; // Vuelvo el precio a 0 para que no quede en venta
        safeTransferFrom(ownerOf(tokenID), _to, tokenID);
        emit nftTransfer(ownerOf(tokenID), _to, tokenID, block.timestamp);

    }
}
