// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Contract for Transfering an NFT Ticket 
/// @dev RachoSuar - TinchoMon
contract TicketsMarketplace is Ownable,ERC721Royalty {

    event nftTransfer(address _from, address _to, uint256 id, uint256 timestamp);

    /// @notice Token address USDC
    IERC20 USDCToken;
    function setToken (address _token) public onlyOwner{
    USDCToken  =  IERC20(_token);
    }

    /// @notice Price for each NFT Ticket
    mapping (uint256 => uint256) public  nftPrice;


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
    
    function transferNFT(uint256 tokenID, address _to) public {
        //require(curreny == usdc, "wrong token");
        require(nftPrice[tokenID] > 0, "This ticket is not for sale");
        require(block.timestamp <= nftDeadlineTransfer[tokenID], "You can not buy this ticket. Deadline expired");
        require(USDCToken.balanceOf(msg.sender)>=nftPrice[tokenID],"Unsufficient founds on the account");
        
        
        //USDCToken.approve(address(this), nftPrice[tokenID]);
        USDCToken.transferFrom(msg.sender, ownerOf(tokenID),nftPrice[tokenID]);
        //USDCToken.transferFrom(msg.sender, contrato splitter,nftPrice[tokenID]*5/100);

        require(_isApprovedOrOwner(_msgSender(), tokenID) || ownerOf(tokenID) == address(this), "ERC721: caller is not token owner or approved");
        _safeTransfer(ownerOf(tokenID), _to, tokenID, "");
        emit nftTransfer(ownerOf(tokenID), _to, tokenID, block.timestamp);
    }


        function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenID, /* firstTokenId */
        uint256 batchSize
    ) internal virtual override {
        require(batchSize == 1, "Incorrect batch size");
        nftPrice[firstTokenID] = 0; // Vuelvo el precio a 0 para que no quede en venta
        super._beforeTokenTransfer(from,to,firstTokenID, batchSize);
    }

}