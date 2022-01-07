//SPDX-License-Identifier: Unlicense

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "./IBondDepository.sol";
import "./IUniswapRouterETH.sol";

contract BondZap is Ownable {
    using SafeERC20 for IERC20;
    using Address for address;

    function zapInToken(
        uint _amount,
        uint _minOut,
        uint _maxPrice,
        address[] memory _route,
        address _bondDepository,
        address _routerAddr,
        address _recipient
    ) external {
        address from = _route[0];
        address to = _route[_route.length - 1];

        require(to == IBondDepository(_bondDepository).principle(), "invalid swap route");

        IERC20(from).safeTransferFrom(msg.sender, address(this), _amount);

        _approveTokenIfNeeded(from, _routerAddr);
        IUniswapRouterETH router = IUniswapRouterETH(_routerAddr);
        uint[] memory amounts = router.swapExactTokensForTokens(_amount, _minOut, _route, address(this), block.timestamp);

        uint amtOut = amounts[amounts.length - 1];

        _approveTokenIfNeeded(to, _bondDepository);
        IBondDepository(_bondDepository).deposit(amtOut, _maxPrice, _recipient);
    }

        /* ========== Private Functions ========== */

    function _approveTokenIfNeeded(address token, address router) private {
        if (IERC20(token).allowance(address(this), router) == 0) {
            IERC20(token).safeApprove(router, type(uint256).max);
        }
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function withdraw(address token) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(address(this).balance);
            return;
        }

        IERC20(token).transfer(owner(), IERC20(token).balanceOf(address(this)));
    }
}
