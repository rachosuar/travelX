// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/finance/PaymentSplitter.sol";

/// @title A sspliter for NFTtickets sell

contract Splitter is PaymentSplitter {
    /// @notice Declare both addresses, airlien and travelX
    /// @dev Create arrays for constructor with payees and shares (60% to Airline 40% to travelX)
    // payees memory[airline,travelX];
    // shares memory[600,400];

    constructor(
        address[] memory _payees,
        uint256[] memory _shares
    ) PaymentSplitter(_payees, _shares) {}

    /// @notice pending withdrawals of IERC20 token for a payee
    /// @dev RachoSuar - TinchoMon
    /// @param token IERC20 token
    /// @param payee address of the payee
    /// @return uint256 amount of pending withdrawals for the payee
    function pending(
        IERC20 token,
        address payee
    ) public view returns (uint256) {
        uint256 total = releasable(token, payee);
        return total;
    }

    /// @notice withdrawa IERC20 token for a payee
    /// @dev RachoSuar - TinchoMon
    /// @param token IERC20 token
    /// @param payee address of the payee
    function withdraw(IERC20 token, address payee) public {
        release(token, payee);
    }
}
