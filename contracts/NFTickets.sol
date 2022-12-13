// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Contract for Transfering an NFT Ticket 
/// @dev RachoSuar - TinchoMon
contract NFTickets is Ownable,ERC721Royalty {
    event TicketCreated(uint256 _id, uint256 price, uint256 timestamp);
    event nftTransfer(address _from, address _to, uint256 id, uint256 timestamp);

    // state variables
    //set Airline and TravelX addresses
    address splitter;
    
    constructor( address _splitter) ERC721 ("TravelX", "TVX"){
        splitter= _splitter;
    
     ////@dev Sets the royalty information for all NFTs.
    _setDefaultRoyalty(splitter, 5000) ; 
    }

    /// @notice Token address USDC
    IERC20 USDCToken;
    function setToken (address _token) public onlyOwner{
    USDCToken  =  IERC20(_token);
    }
    
    /// @notice Deadline timestamp for transfer deadline for each NFT.
    mapping (uint256 => uint256)  public nftDeadlineTransfer;

    /// @notice Price for each NFT Ticket
    mapping (uint256 => uint256) public  nftPrice;

    uint256 totalSupply = 0;
    //ask how many tickets were minted to set the id
      /// @notice create NFTTickets initiali as a Mock, to be confirmed by travelX
    /// @dev RachoSuar - TinchoMon
    /// @param timestamp timestamp of deadline for trading
    /// @param price price set for the NFT
    function createTicket(uint256 timestamp, uint256 price) public onlyOwner {
        _mint(address(this),totalSupply);
        nftDeadlineTransfer[totalSupply]=timestamp;
        nftPrice[totalSupply]=price;
        totalSupply+=1;

        emit TicketCreated(totalSupply, price, timestamp);
        setApprovalForAll(address(this), true);
       
    }

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
        
        USDCToken.approve(address(this), nftPrice[tokenID]);
        USDCToken.transferFrom(msg.sender, ownerOf(tokenID),nftPrice[tokenID]);
        nftPrice[tokenID] = 0; // Vuelvo el precio a 0 para que no quede en venta

        // if (ownerOf(tokenID) != address(this)) 
        //     {approve(address(this), tokenID);
        //         }  // Apruebo al contrato a manejar el NFT
        approve(_to,tokenID);
        transferFrom(ownerOf(tokenID), _to, tokenID);
        emit nftTransfer(ownerOf(tokenID), _to, tokenID, block.timestamp);
    }
}
