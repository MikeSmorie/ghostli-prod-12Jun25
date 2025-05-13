/**
 * Service to interact with various blockchains for transaction verification
 */
import axios from 'axios';
import { Connection, PublicKey } from '@solana/web3.js';
import Web3 from 'web3';
import { CryptoType } from '@db/schema';
import { updateTransactionStatus } from './walletService';

// Define network endpoints
// In production, use your own API keys and ideally multiple providers for redundancy
const BITCOIN_EXPLORER_BASE = 'https://api.blockchair.com/bitcoin';
const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';
const ETH_RPC_URL = 'https://eth-mainnet.g.alchemy.com/v2/demo';
const TRON_API_URL = 'https://api.trongrid.io';

// Define minimum confirmations required for each network
const MIN_CONFIRMATIONS = {
  bitcoin: 3,
  solana: 32,
  usdt_erc20: 12,
  usdt_trc20: 19
};

// Solana connection
const solanaConnection = new Connection(SOLANA_RPC_URL);

// Web3 instance for Ethereum
const web3 = new Web3(ETH_RPC_URL);

/**
 * Gets the minimum confirmations required for each network
 * @param cryptoType - The type of cryptocurrency
 * @returns The minimum number of confirmations required
 */
export function getMinConfirmations(cryptoType: CryptoType): number {
  return MIN_CONFIRMATIONS[cryptoType as keyof typeof MIN_CONFIRMATIONS] || 1;
}

/**
 * Checks if a transaction is confirmed
 * @param cryptoType - The type of cryptocurrency
 * @param transactionHash - The transaction hash
 * @param minConfirmations - Minimum confirmations required (optional)
 * @returns Transaction confirmation status
 */
export async function isTransactionConfirmed(
  cryptoType: CryptoType,
  transactionHash: string,
  minConfirmations?: number
): Promise<{
  confirmed: boolean;
  confirmations: number;
  blockHeight?: number;
  blockTime?: Date;
  amount?: string;
  fee?: string;
  from?: string;
  to?: string;
  raw?: any;
}> {
  try {
    const requiredConfirmations = minConfirmations || getMinConfirmations(cryptoType);
    
    switch (cryptoType) {
      case 'bitcoin':
        return await checkBitcoinTransaction(transactionHash, requiredConfirmations);
      case 'solana':
        return await checkSolanaTransaction(transactionHash, requiredConfirmations);
      case 'usdt_erc20':
        return await checkERC20Transaction(transactionHash, requiredConfirmations);
      case 'usdt_trc20':
        return await checkTRC20Transaction(transactionHash, requiredConfirmations);
      default:
        throw new Error(`Unsupported crypto type: ${cryptoType}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error checking transaction ${transactionHash}:`, errorMessage);
    return {
      confirmed: false,
      confirmations: 0,
      raw: { error: errorMessage }
    };
  }
}

/**
 * Checks a Bitcoin transaction
 * @param txHash - Bitcoin transaction hash
 * @param minConfirmations - Minimum confirmations required
 * @returns Transaction confirmation status
 */
async function checkBitcoinTransaction(
  txHash: string,
  minConfirmations: number
): Promise<{
  confirmed: boolean;
  confirmations: number;
  blockHeight?: number;
  blockTime?: Date;
  amount?: string;
  fee?: string;
  from?: string;
  to?: string;
  raw?: any;
}> {
  try {
    // In production, use your own API key
    const response = await axios.get(`${BITCOIN_EXPLORER_BASE}/dashboards/transaction/${txHash}`);
    
    if (response.status === 200 && response.data.data && response.data.data[txHash]) {
      const txData = response.data.data[txHash];
      const confirmations = txData.transaction.confirmation_count || 0;
      
      return {
        confirmed: confirmations >= minConfirmations,
        confirmations,
        blockHeight: txData.transaction.block_id,
        blockTime: new Date(txData.transaction.time * 1000),
        amount: txData.transaction.output_total.toString(),
        fee: txData.transaction.fee.toString(),
        from: txData.inputs[0]?.recipient || '',
        to: txData.outputs[0]?.recipient || '',
        raw: txData
      };
    }
    
    return { confirmed: false, confirmations: 0 };
  } catch (error) {
    console.error('Error checking Bitcoin transaction:', error);
    return { confirmed: false, confirmations: 0 };
  }
}

/**
 * Checks a Solana transaction
 * @param txHash - Solana transaction signature
 * @param minConfirmations - Minimum confirmations required
 * @returns Transaction confirmation status
 */
async function checkSolanaTransaction(
  txHash: string,
  minConfirmations: number
): Promise<{
  confirmed: boolean;
  confirmations: number;
  blockHeight?: number;
  blockTime?: Date;
  amount?: string;
  fee?: string;
  from?: string;
  to?: string;
  raw?: any;
}> {
  try {
    // Get transaction details
    const txData = await solanaConnection.getTransaction(txHash, {
      maxSupportedTransactionVersion: 0
    });
    
    if (!txData) {
      return { confirmed: false, confirmations: 0 };
    }
    
    // Get current slot to calculate confirmations
    const currentSlot = await solanaConnection.getSlot();
    const confirmations = currentSlot - txData.slot;
    
    // Extract transaction info
    const blockTime = txData.blockTime ? new Date(txData.blockTime * 1000) : undefined;
    const fee = txData.meta?.fee?.toString();
    
    // Extract sender and recipient (simplified, in reality this is more complex)
    let from, to, amount;
    if (txData.transaction.message && txData.meta?.postTokenBalances) {
      // Handle different message versions in Solana transactions
      const message = txData.transaction.message;
      const accounts = message.getAccountKeys ? 
        message.getAccountKeys() : 
        message.staticAccountKeys || [];
        
      from = accounts[0]?.toBase58();
      to = accounts[1]?.toBase58();
      
      // This is a simplified approach; actual SOL amount calculation is more complex
      if (txData.meta.postBalances && txData.meta.preBalances) {
        const preBalance = txData.meta.preBalances[0] || 0;
        const postBalance = txData.meta.postBalances[0] || 0;
        amount = ((preBalance - postBalance) / 1_000_000_000).toString();
      }
    }
    
    return {
      confirmed: confirmations >= minConfirmations,
      confirmations,
      blockHeight: txData.slot,
      blockTime,
      amount,
      fee,
      from,
      to,
      raw: txData
    };
  } catch (error) {
    console.error('Error checking Solana transaction:', error);
    return { confirmed: false, confirmations: 0 };
  }
}

/**
 * Checks an Ethereum ERC20 (USDT) transaction
 * @param txHash - Ethereum transaction hash
 * @param minConfirmations - Minimum confirmations required
 * @returns Transaction confirmation status
 */
async function checkERC20Transaction(
  txHash: string,
  minConfirmations: number
): Promise<{
  confirmed: boolean;
  confirmations: number;
  blockHeight?: number;
  blockTime?: Date;
  amount?: string;
  fee?: string;
  from?: string;
  to?: string;
  raw?: any;
}> {
  try {
    // Get transaction details
    const tx = await web3.eth.getTransaction(txHash);
    
    if (!tx) {
      return { confirmed: false, confirmations: 0 };
    }
    
    // Get transaction receipt to check status and confirmations
    const receipt = await web3.eth.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return { confirmed: false, confirmations: 0 };
    }
    
    // Get current block
    const currentBlock = await web3.eth.getBlockNumber();
    const confirmations = receipt.blockNumber ? currentBlock - receipt.blockNumber : 0;
    
    // Get block info for timestamp
    const block = receipt.blockNumber 
      ? await web3.eth.getBlock(receipt.blockNumber) 
      : null;
    
    const blockTime = block && block.timestamp 
      ? new Date(Number(block.timestamp) * 1000) 
      : undefined;
    
    // Calculate gas fee
    const gasUsed = receipt.gasUsed || 0;
    const gasPrice = tx.gasPrice || 0;
    const fee = web3.utils.fromWei((gasUsed * gasPrice).toString(), 'ether');
    
    return {
      confirmed: confirmations >= minConfirmations && receipt.status,
      confirmations,
      blockHeight: receipt.blockNumber,
      blockTime,
      amount: tx.value ? web3.utils.fromWei(tx.value.toString(), 'ether') : undefined,
      fee,
      from: tx.from,
      to: tx.to,
      raw: { tx, receipt }
    };
  } catch (error) {
    console.error('Error checking ERC20 transaction:', error);
    return { confirmed: false, confirmations: 0 };
  }
}

/**
 * Checks a Tron TRC20 (USDT) transaction
 * @param txHash - Tron transaction hash
 * @param minConfirmations - Minimum confirmations required
 * @returns Transaction confirmation status
 */
async function checkTRC20Transaction(
  txHash: string,
  minConfirmations: number
): Promise<{
  confirmed: boolean;
  confirmations: number;
  blockHeight?: number;
  blockTime?: Date;
  amount?: string;
  fee?: string;
  from?: string;
  to?: string;
  raw?: any;
}> {
  try {
    // In production, use your own API key
    const response = await axios.get(`${TRON_API_URL}/v1/transactions/${txHash}`);
    
    if (response.status === 200 && response.data) {
      const txData = response.data;
      
      // Tron doesn't provide confirmations directly,
      // so we estimate it based on current block - transaction block
      const blockResponse = await axios.get(`${TRON_API_URL}/wallet/getnowblock`);
      const currentBlock = blockResponse.data.block_header.raw_data.number;
      const txBlock = txData.blockNumber;
      const confirmations = currentBlock - txBlock;
      
      // Extract transaction info
      const blockTime = new Date(txData.block_timestamp);
      
      return {
        confirmed: confirmations >= minConfirmations,
        confirmations,
        blockHeight: txBlock,
        blockTime,
        amount: txData.amount || txData.value,
        fee: txData.fee || '0',
        from: txData.owner_address,
        to: txData.to_address,
        raw: txData
      };
    }
    
    return { confirmed: false, confirmations: 0 };
  } catch (error) {
    console.error('Error checking TRC20 transaction:', error);
    return { confirmed: false, confirmations: 0 };
  }
}

/**
 * Process pending crypto transactions
 * This function would be called periodically to check pending transactions
 * @returns The number of transactions processed
 */
export async function processPendingTransactions(): Promise<number> {
  // In a real implementation, you would:
  // 1. Fetch all pending transactions from the database
  // 2. Check each transaction's status on the blockchain
  // 3. Update transaction status in the database
  // 4. Trigger downstream actions (like activating subscriptions) if transactions are confirmed
  
  // For now, we'll return a placeholder
  return 0;
}

/**
 * Starts a transaction monitoring service
 * @param intervalMs - How often to check for new transactions (in milliseconds)
 * @returns A function to stop the monitoring
 */
export function startTransactionMonitoring(intervalMs: number = 60000): () => void {
  // In a real implementation, this would start a timer to call processPendingTransactions
  // at regular intervals, and return a function to stop the timer
  
  console.log(`Starting transaction monitoring with interval ${intervalMs}ms`);
  
  // Start the interval
  const intervalId = setInterval(async () => {
    try {
      const processed = await processPendingTransactions();
      if (processed > 0) {
        console.log(`Processed ${processed} pending transactions`);
      }
    } catch (error) {
      console.error('Error in transaction monitoring:', error);
    }
  }, intervalMs);
  
  // Return a function to stop the monitoring
  return () => {
    clearInterval(intervalId);
    console.log('Stopped transaction monitoring');
  };
}