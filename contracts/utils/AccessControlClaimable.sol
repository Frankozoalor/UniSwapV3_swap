// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;

import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";

/**
 * @title AccessControlClaimable
 * @dev Contract module which provides a basic access control claimable mechanism, where
 * there is an account (an owner/approver) that can be granted exclusive access to
 * specific functions.
 *
 * This module is used through inheritance. It will make available the modifier
 */
contract AccessControlClaimable {
    mapping(bytes32 => address) private _roles;
    mapping(bytes32 => address) private _pendingRoles;

    /**
     * @dev Emitted when a new role assignment is requested.
     * @param role The role that is being requested by the account.
     * @param requested The account address that is requesting the role
     */
    event TransferRequested(bytes32 role, address requested);

    /**
     * @dev Emitted when a new role assignment is confirmed.
     * @param role The role that is being assigned by the account.
     * @param account The account address that is assigned the role
     */
    event RoleAssigned(bytes32 role, address account);

    /**
     * @dev Modifier that checks that an account has a specific role. Reverts
     * with a standardized message including the required role.
     *
     * The format of the revert reason is given by the following regular expression:
     *
     * /^AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})$/
     *
     * @param role the Role to check for
     */
    // modifier onlyRole(bytes32 role) {
    //     _checkRole(role, msg.sender);
    //     _;
    // }

    /**
     * @dev Internal function to request a transfer of role
     * adds the requested address to the pending roles
     *
     * Emits a {TransferRequested} event.
     *
     * @param role The role that is being requested by the account.
     * @param account The account address that is requesting the role
     */
    function _transferRole(bytes32 role, address account) internal {
        _pendingRoles[role] = account;
        emit TransferRequested(role, account);
    }

    /**
     * @dev Internal function to assign a new role to an account, and removes it from the
     * `_pendingRoles`
     *
     * Emits a {RoleAssigned} event.
     *
     * @param role the Role to assign
     * @param account the account to assign the role to
     */
    function _assignRole(bytes32 role, address account) internal {
        _roles[role] = account;
        _pendingRoles[role] = address(0);

        emit RoleAssigned(role, account);
    }

    /**
     * @dev Revert with a standard message if `account` is missing `role`.
     *
     * The format of the revert reason is given by the following regular expression:
     *
     *  /^AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})$/
     * @param role the Role to check for
     * @param account the account to check for the role
     */
    // function _checkRole(bytes32 role, address account) internal view virtual {
    //     if (!hasRole(role, account)) {
    //         revert(
    //             string(
    //                 abi.encodePacked(
    //                     Strings.toHexString(uint160(account), 20),
    //                     " is missing role ",
    //                     Strings.toHexString(uint256(role), 32)
    //                 )
    //             )
    //         );
    //     }
    // }

    /**
     * @dev Allows a role owner to transfer their role to a new account (`account`).
     * uses the internal function {_transferRole} to add the new account to the pending roles
     *
     * Emits a {TransferRequested} event.
     *
     * @param role the role to transfer
     * @param account the account to transfer the role to
     */
    // function transferRole(bytes32 role, address account) public onlyRole(role) {
    //     _transferRole(role, account);
    // }

    /**
     * @dev Allows an user to claim a role,
     * uses the internal function {_assignRole} to assign the role
     *
     * Emits a {RoleAssigned} event.
     *
     * @param role the role to transfer
     */
    function claimRole(bytes32 role) public {
        require(_pendingRoles[role] == msg.sender, "Unauthorised");
        _assignRole(role, msg.sender);
    }

    /**
     * @dev Returns true if the account has the role assigned.
     * @param role The role to check for.
     * @param account The account to check for.
     * @return bool
     */
    function hasRole(bytes32 role, address account) public view returns (bool) {
        return _roles[role] == account;
    }

    /**
     * @dev Returns the address of a particular assigned role.
     * @param role The role to get its address.
     */
    function getRole(bytes32 role) public view returns (address) {
        return _roles[role];
    }

    /**
     * @dev Returns the account address of a pending role.
     * @param role The role to get the pending account of.
     */
    function getPendingRole(bytes32 role) public view returns (address) {
        return _pendingRoles[role];
    }
}
