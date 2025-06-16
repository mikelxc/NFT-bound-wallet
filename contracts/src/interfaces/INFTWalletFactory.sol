// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface INFTWalletFactory {
    event WalletCreated(uint256 indexed tokenId, address indexed wallet, address indexed owner);
    event MintingFeeUpdated(uint256 newFee);

    function mintWallet(address to) external payable returns (uint256 tokenId, address wallet);
    function getWalletAddress(uint256 tokenId) external view returns (address);
    function tokenIdToWallet(uint256 tokenId) external view returns (address);
    function walletToTokenId(address wallet) external view returns (uint256);
    function mintingFee() external view returns (uint256);
    function kernelFactory() external view returns (address);
    function nftBoundValidator() external view returns (address);
}