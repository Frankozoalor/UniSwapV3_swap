// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "contracts/utils/AccessControlClaimable.sol";
import "hardhat/console.sol";
import "./SimpleSwap.sol";

contract SimpleSwapFactory is AccessControlClaimable {
    bytes32 constant OWNER_ROLE = keccak256(abi.encodePacked("OWNER"));
    bytes32 public APPROVER_ROLE = keccak256(abi.encodePacked("APPROVER"));
    address public swapRouter = 0xE592427A0AEce92De3Edee1F18E0157C05861564;

    address public simpleSwapImpl;
    address public factoryContract = 0x1F98431c8aD98523631AE4a59f267346ea31F984;
    address public _WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    event SimpleSwapDeployed(
        address indexed deployedAt,
        address indexed owner,
        uint8 indexed version
    );

    constructor(address _approver) {
        require(_approver != address(0), "F: Invalid approver");

        _assignRole(OWNER_ROLE, msg.sender);
        _assignRole(APPROVER_ROLE, _approver);

        simpleSwapImpl = address(
            new SimpleSwap(ISwapRouter(swapRouter), factoryContract, _WETH)
        );
    }

    function deploySimpleSwap() external returns (address) {
        address _simpleSwap = Clones.clone(simpleSwapImpl);

        emit SimpleSwapDeployed(
            _simpleSwap,
            msg.sender,
            SimpleSwap(payable(_simpleSwap)).VERSION()
        );

        console.log("deployed address", _simpleSwap);
        return address(_simpleSwap);
    }
}
