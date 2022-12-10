// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/finance/PaymentSplitter.sol";

/// @title A sspliter for NFTtickets sell



contract Splitter is PaymentSplitter{
/// @notice Declare both addresses, airlien and travelX
address airline = 0x....;
address travelX = 0x....;
/// @dev Create arrays for constructor with payees and shares (60% to Airline 40% to travelX)
    payees memory[airline,travelX];
    shares memory[600,400];

    constructor(payees,shares) payable {

    }
  
}
