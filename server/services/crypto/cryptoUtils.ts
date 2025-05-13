/**
 * Utility functions for crypto wallet generation and management
 */
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import Web3 from 'web3';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import * as crypto from 'crypto';

// Initialize BIP32
const bip32 = BIP32Factory(ecc);

// Define network settings
const BITCOIN_NETWORK = bitcoin.networks.bitcoin; // Use bitcoin.networks.testnet for testnet
const SOLANA_NETWORK = 'mainnet-beta'; // Use 'devnet' for testing

// Define constants
const CRYPTO_DERIVATION_PATHS = {
  bitcoin: "m/44'/0'/0'/0/0", // BIP44 for Bitcoin
  solana: "m/44'/501'/0'/0'", // BIP44 for Solana
  usdt_erc20: "m/44'/60'/0'/0/0", // BIP44 for Ethereum (USDT ERC20)
  usdt_trc20: "m/44'/195'/0'/0/0", // BIP44 for Tron (USDT TRC20)
};

/**
 * Encrypts sensitive data like private keys
 * @param data - The data to encrypt
 * @param secretKey - The encryption key
 * @returns Encrypted data string
 */
export function encryptData(data: string, secretKey: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(secretKey).digest('base64').substring(0, 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(data, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts sensitive data like private keys
 * @param encryptedData - The encrypted data string
 * @param secretKey - The encryption key
 * @returns Decrypted data
 */
export function decryptData(encryptedData: string, secretKey: string): string {
  const [ivHex, encryptedHex] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.createHash('sha256').update(secretKey).digest('base64').substring(0, 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  
  return decrypted;
}

/**
 * Generates a deterministic wallet from a seed phrase
 * @param cryptoType - The type of cryptocurrency
 * @param seedPhrase - Optional seed phrase to use (will generate a new one if not provided)
 * @param userId - User ID to use for deterministic generation
 * @param encryptionKey - Key to encrypt private keys
 * @returns Wallet information
 */
export async function generateWallet(
  cryptoType: 'bitcoin' | 'solana' | 'usdt_erc20' | 'usdt_trc20',
  userId: number,
  encryptionKey: string,
  seedPhrase?: string
): Promise<{
  address: string;
  publicKey: string;
  privateKey: string;
  seedPhrase: string;
}> {
  // Generate or use provided seed phrase
  const mnemonic = seedPhrase || bip39.generateMnemonic(256);
  const seed = await bip39.mnemonicToSeed(mnemonic);
  
  // Add user-specific entropy to ensure uniqueness
  const userEntropy = crypto.createHash('sha256').update(`${userId}-${cryptoType}`).digest();
  
  switch (cryptoType) {
    case 'bitcoin':
      return generateBitcoinWallet(seed, mnemonic, encryptionKey, userEntropy);
    case 'solana':
      return generateSolanaWallet(seed, mnemonic, encryptionKey, userEntropy);
    case 'usdt_erc20':
      return generateERC20Wallet(seed, mnemonic, encryptionKey, userEntropy);
    case 'usdt_trc20':
      return generateTRC20Wallet(seed, mnemonic, encryptionKey, userEntropy);
    default:
      throw new Error(`Unsupported crypto type: ${cryptoType}`);
  }
}

/**
 * Generates a Bitcoin wallet
 * @param seed - The seed to derive the wallet from
 * @param mnemonic - The mnemonic seed phrase
 * @param encryptionKey - Key to encrypt private keys
 * @param userEntropy - User-specific entropy
 * @returns Bitcoin wallet information
 */
function generateBitcoinWallet(
  seed: Buffer,
  mnemonic: string,
  encryptionKey: string,
  userEntropy: Buffer
): {
  address: string;
  publicKey: string;
  privateKey: string;
  seedPhrase: string;
} {
  // Derive the HD wallet
  const hdNode = bip32.fromSeed(seed, BITCOIN_NETWORK);
  
  // Derive the specific path with user entropy
  const path = CRYPTO_DERIVATION_PATHS.bitcoin;
  const userPath = `${path}/${userEntropy.readUInt32BE(0) % 1000}'`;
  const childNode = hdNode.derivePath(userPath);
  
  // Get Bitcoin keys and address
  const privateKey = childNode.privateKey!.toString('hex');
  const publicKey = childNode.publicKey.toString('hex');
  
  // Generate P2WPKH (Native SegWit) address
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: childNode.publicKey,
    network: BITCOIN_NETWORK,
  });
  
  // Encrypt sensitive information
  const encryptedPrivateKey = encryptData(privateKey, encryptionKey);
  const encryptedSeedPhrase = encryptData(mnemonic, encryptionKey);
  
  return {
    address: address!,
    publicKey,
    privateKey: encryptedPrivateKey,
    seedPhrase: encryptedSeedPhrase,
  };
}

/**
 * Generates a Solana wallet
 * @param seed - The seed to derive the wallet from
 * @param mnemonic - The mnemonic seed phrase
 * @param encryptionKey - Key to encrypt private keys
 * @param userEntropy - User-specific entropy
 * @returns Solana wallet information
 */
function generateSolanaWallet(
  seed: Buffer,
  mnemonic: string,
  encryptionKey: string,
  userEntropy: Buffer
): {
  address: string;
  publicKey: string;
  privateKey: string;
  seedPhrase: string;
} {
  // Create Solana keypair from seed
  const keypair = Keypair.fromSeed(
    seed.slice(0, 32).map((b, i) => b ^ userEntropy[i % userEntropy.length])
  );
  
  // Get Solana keys and address
  const privateKey = Buffer.from(keypair.secretKey).toString('hex');
  const publicKey = keypair.publicKey.toString();
  const address = keypair.publicKey.toBase58();
  
  // Encrypt sensitive information
  const encryptedPrivateKey = encryptData(privateKey, encryptionKey);
  const encryptedSeedPhrase = encryptData(mnemonic, encryptionKey);
  
  return {
    address,
    publicKey,
    privateKey: encryptedPrivateKey,
    seedPhrase: encryptedSeedPhrase,
  };
}

/**
 * Generates an Ethereum wallet for USDT ERC20
 * @param seed - The seed to derive the wallet from
 * @param mnemonic - The mnemonic seed phrase
 * @param encryptionKey - Key to encrypt private keys
 * @param userEntropy - User-specific entropy
 * @returns Ethereum wallet information
 */
function generateERC20Wallet(
  seed: Buffer,
  mnemonic: string,
  encryptionKey: string,
  userEntropy: Buffer
): {
  address: string;
  publicKey: string;
  privateKey: string;
  seedPhrase: string;
} {
  try {
    // Use the HD wallet with user entropy
    const hdNode = bip32.fromSeed(seed);
    const path = CRYPTO_DERIVATION_PATHS.usdt_erc20;
    const userPath = `${path}/${userEntropy.readUInt32BE(0) % 1000}'`;
    const childNode = hdNode.derivePath(userPath);
    
    // Get the private key
    const privateKeyBuffer = childNode.privateKey;
    if (!privateKeyBuffer) throw new Error('Failed to generate private key');
    
    // Create Web3 instance and wallet
    const web3Instance = new Web3();
    const privateKeyHex = '0x' + privateKeyBuffer.toString('hex');
    const account = web3Instance.eth.accounts.privateKeyToAccount(privateKeyHex);
    
    // Get the wallet details
    const address = account.address;
    const publicKey = '0x' + childNode.publicKey.toString('hex');
    const privateKey = '0x' + privateKeyBuffer.toString('hex');
    
    // Encrypt sensitive information
    const encryptedPrivateKey = encryptData(privateKey, encryptionKey);
    const encryptedSeedPhrase = encryptData(mnemonic, encryptionKey);
    
    return {
      address,
      publicKey,
      privateKey: encryptedPrivateKey,
      seedPhrase: encryptedSeedPhrase,
    };
  } catch (error) {
    console.error('Error generating ERC20 wallet:', error);
    throw new Error(`Failed to generate ERC20 wallet: ${error.message}`);
  }
}

/**
 * Generates a Tron wallet for USDT TRC20
 * Note: This is a simplified implementation as we don't have a full Tron library
 * @param seed - The seed to derive the wallet from
 * @param mnemonic - The mnemonic seed phrase
 * @param encryptionKey - Key to encrypt private keys
 * @param userEntropy - User-specific entropy
 * @returns Tron wallet information
 */
function generateTRC20Wallet(
  seed: Buffer,
  mnemonic: string,
  encryptionKey: string,
  userEntropy: Buffer
): {
  address: string;
  publicKey: string;
  privateKey: string;
  seedPhrase: string;
} {
  // For TRC20, we'll use a similar approach to ERC20 but with a different address format
  // In a real implementation, we would use the TronWeb library
  
  // Use the HD wallet with user entropy
  const hdNode = bip32.fromSeed(seed);
  const path = CRYPTO_DERIVATION_PATHS.usdt_trc20;
  const userPath = `${path}/${userEntropy.readUInt32BE(0) % 1000}'`;
  const childNode = hdNode.derivePath(userPath);
  
  // Get the private key
  const privateKeyBuffer = childNode.privateKey;
  if (!privateKeyBuffer) throw new Error('Failed to generate private key');
  
  // Instead of actual TRC20 address generation (which would require TronWeb),
  // we'll create a deterministic address format
  const publicKeyBuffer = childNode.publicKey;
  
  // Create address (this is a simplified implementation)
  // In reality, Tron addresses have a specific format and creation process
  const addressHash = crypto.createHash('sha256').update(publicKeyBuffer).digest();
  const address = 'T' + addressHash.toString('hex').substring(0, 33);
  
  // Get the wallet details
  const publicKey = publicKeyBuffer.toString('hex');
  const privateKey = privateKeyBuffer.toString('hex');
  
  // Encrypt sensitive information
  const encryptedPrivateKey = encryptData(privateKey, encryptionKey);
  const encryptedSeedPhrase = encryptData(mnemonic, encryptionKey);
  
  return {
    address,
    publicKey,
    privateKey: encryptedPrivateKey,
    seedPhrase: encryptedSeedPhrase,
  };
}

/**
 * Validates a cryptocurrency address
 * @param address - The address to validate
 * @param cryptoType - The type of cryptocurrency
 * @returns Whether the address is valid
 */
export function validateAddress(
  address: string,
  cryptoType: 'bitcoin' | 'solana' | 'usdt_erc20' | 'usdt_trc20'
): boolean {
  try {
    switch (cryptoType) {
      case 'bitcoin':
        // Validate Bitcoin address
        bitcoin.address.toOutputScript(address, BITCOIN_NETWORK);
        return true;
      case 'solana':
        // Validate Solana address
        return PublicKey.isOnCurve(new PublicKey(address).toBytes());
      case 'usdt_erc20':
        // Validate Ethereum address
        const web3Instance = new Web3();
        return web3Instance.utils.isAddress(address);
      case 'usdt_trc20':
        // Simplified Tron address validation (starts with T and is 34 characters)
        return address.startsWith('T') && address.length === 34;
      default:
        return false;
    }
  } catch (error) {
    console.error(`Error validating ${cryptoType} address:`, error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Gets the current USD exchange rate for a cryptocurrency
 * This would normally call an external API, but for simplicity we'll use hardcoded values
 * @param cryptoType - The type of cryptocurrency
 * @returns The exchange rate in USD
 */
export async function getExchangeRate(
  cryptoType: 'bitcoin' | 'solana' | 'usdt_erc20' | 'usdt_trc20'
): Promise<number> {
  // In a real implementation, this would fetch from CoinGecko, Binance, or similar APIs
  switch (cryptoType) {
    case 'bitcoin':
      return 60000.00; // Example BTC price
    case 'solana':
      return 120.00; // Example SOL price
    case 'usdt_erc20':
    case 'usdt_trc20':
      return 1.00; // USDT is pegged to USD
    default:
      throw new Error(`Unsupported crypto type: ${cryptoType}`);
  }
}