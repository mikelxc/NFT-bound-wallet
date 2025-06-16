// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ECDSA} from "solady/utils/ECDSA.sol";
import {ERC721} from "solady/tokens/ERC721.sol";
import {IValidator, IHook} from "kernel/src/interfaces/IERC7579Modules.sol";
import {PackedUserOperation} from "kernel/src/interfaces/PackedUserOperation.sol";
import {
    SIG_VALIDATION_SUCCESS_UINT,
    SIG_VALIDATION_FAILED_UINT,
    MODULE_TYPE_VALIDATOR,
    MODULE_TYPE_HOOK,
    ERC1271_MAGICVALUE,
    ERC1271_INVALID
} from "kernel/src/types/Constants.sol";

struct NFTBoundValidatorStorage {
    address nftContract;
    uint256 tokenId;
}

contract NFTBoundValidator is IValidator, IHook {
    event NFTBound(address indexed kernel, address indexed nftContract, uint256 indexed tokenId);

    mapping(address => NFTBoundValidatorStorage) public nftBoundValidatorStorage;

    error InvalidNFTContract();
    error NotNFTOwner();

    function onInstall(bytes calldata _data) external payable override {
        if (_isInitialized(msg.sender)) revert AlreadyInitialized(msg.sender);
        
        (address nftContract, uint256 tokenId) = abi.decode(_data, (address, uint256));
        nftBoundValidatorStorage[msg.sender].nftContract = nftContract;
        nftBoundValidatorStorage[msg.sender].tokenId = tokenId;
        emit NFTBound(msg.sender, nftContract, tokenId);
    }

    function onUninstall(bytes calldata) external payable override {
        if (!_isInitialized(msg.sender)) revert NotInitialized(msg.sender);
        delete nftBoundValidatorStorage[msg.sender];
    }

    function isModuleType(uint256 typeID) external pure override returns (bool) {
        return typeID == MODULE_TYPE_VALIDATOR || typeID == MODULE_TYPE_HOOK;
    }

    function isInitialized(address smartAccount) external view override returns (bool) {
        return _isInitialized(smartAccount);
    }

    function _isInitialized(address smartAccount) internal view returns (bool) {
        return nftBoundValidatorStorage[smartAccount].nftContract != address(0);
    }

    function _getNFTOwner(address smartAccount) internal view returns (address) {
        NFTBoundValidatorStorage memory storage_ = nftBoundValidatorStorage[smartAccount];
        return ERC721(storage_.nftContract).ownerOf(storage_.tokenId);
    }

    function _validateSignature(address owner, bytes32 hash, bytes calldata sig) internal view returns (bool) {
        try this.recoverSigner(hash, sig) returns (address recovered) {
            if (owner == recovered) {
                return true;
            }
        } catch {
            // Ignore invalid signature error
        }
        
        bytes32 ethHash = ECDSA.toEthSignedMessageHash(hash);
        try this.recoverSigner(ethHash, sig) returns (address recovered) {
            return owner == recovered;
        } catch {
            return false;
        }
    }
    
    function recoverSigner(bytes32 hash, bytes calldata sig) external view returns (address) {
        return ECDSA.recover(hash, sig);
    }

    function validateUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash)
        external
        payable
        override
        returns (uint256)
    {
        address owner = _getNFTOwner(msg.sender);
        bytes calldata sig = userOp.signature;
        return _validateSignature(owner, userOpHash, sig) ? SIG_VALIDATION_SUCCESS_UINT : SIG_VALIDATION_FAILED_UINT;
    }

    function isValidSignatureWithSender(address, bytes32 hash, bytes calldata sig)
        external
        view
        override
        returns (bytes4)
    {
        address owner = _getNFTOwner(msg.sender);
        return _validateSignature(owner, hash, sig) ? ERC1271_MAGICVALUE : ERC1271_INVALID;
    }

    function preCheck(address msgSender, uint256 value, bytes calldata)
        external
        payable
        override
        returns (bytes memory)
    {
        address owner = _getNFTOwner(msg.sender);
        require(msgSender == owner, "NFTBoundValidator: sender is not NFT owner");
        return hex"";
    }

    function postCheck(bytes calldata hookData) external payable override {}
}