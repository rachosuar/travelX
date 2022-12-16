// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTickets is Ownable, ERC721Royalty, ERC721URIStorage {
    address splitter;

    constructor(address _splitter) ERC721("TravelX", "TVX") {
        splitter = _splitter;

        ////@dev Sets the royalty information for all NFTs.
        _setDefaultRoyalty(splitter, 5000);
    }

    event TicketCreated(uint256 _id, uint256 _price, uint256 timestamp);

    mapping(uint256 => string) private _tokenURIs;

    /// @notice Counter of NFT Tickets minted
    uint256 public totalSupply = 1;

    /// @notice Deadline timestamp for transfer deadline for each NFT.
    mapping(uint256 => uint256) public nftDeadlineTransfer;

    /// @notice Price for each NFT Ticket
    mapping(uint256 => uint256) public nftPrice;

    /// @notice create NFTTickets when called by owner
    /// @dev RachoSuar - TinchoMon
    /// @param timestamp timestamp of deadline for trading
    /// @param price price set for the NFT
    /// @param _tokenURI URI for ticket metadata IPFS
    function createTicket(
        uint256 timestamp,
        uint256 price,
        string memory _tokenURI
    ) external onlyOwner {
        _mint(msg.sender, totalSupply);
        _setTokenURI(totalSupply, _tokenURI);

        nftDeadlineTransfer[totalSupply] = timestamp;
        nftPrice[totalSupply] = price;

        emit TicketCreated(totalSupply, price, timestamp);
        totalSupply += 1;
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public virtual override {
        _safeTransfer(from, to, tokenId, data);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return "/ipfs/QmbYSMqKG4FEnvMpNVxxnNKq4UqnFz3WKgjBeQ27v75U3v/";
    }

    /// @notice set price for NFT ticket passed by params
    /// @dev RachoSuar - TinchoMon
    /// @param id of the NFT that will change its price
    /// @param amount price set for the NFT
    function setPrice(uint256 id, uint256 amount) public onlyOwner {
        require(nftDeadlineTransfer[id] > 0, "Ticket doesn't exist");
        require(ownerOf(id) == tx.origin);
        nftPrice[id] = amount;
    }

    /// @notice get price for NFT ticket passed by params
    /// @dev RachoSuar - TinchoMon
    /// @param id of the NFT
    /// @return price of the NFT
    function getPrice(uint256 id) public view returns (uint256 price) {
        return nftPrice[id];
    }

    /// @notice gets deadline of transfer for an NFT
    /// @dev RachoSuar - TinchoMon
    /// @param id of the NFT
    /// @return deadline (timestamp) of the NFT to be transfered
    function getDeadline(uint256 id) public view returns (uint256 deadline) {
        return nftDeadlineTransfer[id];
    }

    /// @notice asks if NFT is on sale or not
    /// @dev RachoSuar - TinchoMon
    /// @param id of the NFT
    /// @return bool NFT is on Sale?
    function isOnSale(uint256 id) public view returns (bool) {
        return nftPrice[id] > 0 && nftDeadlineTransfer[id] > block.timestamp;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenID /* firstTokenId */,
        uint256 batchSize
    ) internal virtual override {
        require(batchSize == 1, "Incorrect batch size");
        NFTickets.nftPrice[firstTokenID] = 0; // Vuelvo el precio a 0 para que no quede en venta
        super._beforeTokenTransfer(from, to, firstTokenID, batchSize);
    }

    function _burn(
        uint256 tokenId
    ) internal virtual override(ERC721URIStorage, ERC721Royalty) {
        super._burn(tokenId);

        if (bytes(_tokenURIs[tokenId]).length != 0) {
            delete _tokenURIs[tokenId];
        }
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, ERC721Royalty) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(
        uint256 tokenId
    )
        public
        view
        virtual
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        _requireMinted(tokenId);

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }

        return super.tokenURI(tokenId);
    }
}
